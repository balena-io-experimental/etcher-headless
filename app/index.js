var ImageWriter = require('./writer')
var request = require('simple-get')
var drivelist = require('drivelist')
var debug = require('debug')('multiwrite')
var fs = require('fs')
var path = require('path')
var EventEmitter = require('events')
var mountutils = require('mountutils')
var MBR = require('mbr')
var color = require('colors-cli')
var ProgressStream = require('progress-stream')
var _ = require('lodash')
var Meter = require('./meter')

var IMAGE_URL = process.env.IMAGE_URL

var IMAGE_DATA_DIR = process.env.IMAGE_DATA_DIR ?
  process.env.IMAGE_DATA_DIR : '/data'

var DRIVE_BLACKLIST = process.env.DRIVE_BLACKLIST ?
  process.env.DRIVE_BLACKLIST.split(',') : null

debug( 'IMAGE_URL', IMAGE_URL )
debug( 'IMAGE_DATA_DIR', IMAGE_DATA_DIR )
debug( 'DRIVE_BLACKLIST', DRIVE_BLACKLIST )

const UNITS = [ 'B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB' ]

function prettybytes( num ) {

  const prefix = num < 0 ? '-' : ''

  num = num < 0 ? -num : num

  if (num < 1) {
    return prefix + num + ' B'
  }

  const exponent = Math.min( Math.floor( Math.log10( num ) / 3 ), UNITS.length - 1 )
  const numStr = Number( ( num / Math.pow( 1024, exponent ) ).toFixed( 1 ) )
  const unit = UNITS[ exponent ]

  return prefix + numStr + ' ' + unit

}

function read( filename, length ) {
  try {
    var offset = 0
    var position = 0
    var buffer = Buffer.alloc( length, 0 )
    var fd = fs.openSync( filename, 'rs' )
    fs.readSync( fd, buffer, offset, length, position )
    return buffer
  } catch( error ) {
    // we don't care
    debug( 'read', error )
  }
}

function isResinOS( drive ) {
  var buffer = read( drive.device, 512 )
  var partitions = 0
  var mbr = null
  try {
    mbr = MBR.parse( buffer )
    partitions = mbr.partitions.reduce((count, partition) => {
      return partition.type ? count + 1 : count
    }, 0 )
    debug( 'mbr', mbr )
    debug( 'partitions', partitions )
  } catch( error ) {
    debug( 'isResinOS', error )
  }
  return partitions > 2
}

var progress = new Meter( process.stdout )

class Hub extends EventEmitter {

  constructor() {

    super()

    this.processes = new Map()
    this.blacklist = DRIVE_BLACKLIST || []
    this.currentDrives = []

    this.running = true
    this.imageSize = null
    this.filename = null

    this.once( 'ready', () => {
      debug( 'ready' )
      this.start()
      this.scan()
    })

    // Download image and then start flashing
    this.fetch()

  }

  scan() {
    debug( 'scan' )
    drivelist.list(( error, drives ) => {
      if( error ) this.emit( 'error', error )
      drives = drives.filter(( drive ) => {
        return !~this.blacklist.indexOf( drive.device ) &&
          drive.system === false &&
          drive.protected === false &&
          !/mac/i.test(drive.description)
      })
      debug( 'drives %O', error || drives )
      this.update(drives)
      if( this.running ) {
        this.scan()
      }
    })
  }

  fetch() {

    this.filename = path.join( IMAGE_DATA_DIR, path.basename( IMAGE_URL ) )

    console.log( 'fetch', this.filename )

    try {
      var stats = fs.statSync( this.filename )
      if( stats.isFile() ) {
        this.imageSize = fs.statSync( this.filename ).size
        console.log( 'fetch:exists' )
        console.log( 'flashing', path.basename( this.filename ), `(${prettybytes(this.imageSize)})` )
        this.emit( 'ready' )
        return
      }
    } catch( error ) {
      console.log( 'fetch:download' )
    }

    const imageSize = 2780290560

    var dest = fs.createWriteStream( this.filename )
    var onError = ( error ) => { this.emit( 'error', error ) }
    var measure = new ProgressStream({
      length: imageSize,
      time: 500
    })

    var spinner = progress.createGauge( `[:bar] :message`, {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: imageSize,
      clear: true,
    })

    measure.on( 'progress', (state) => {

      var speed = prettybytes( state.speed )
      var eta = `${(state.eta / 60).toFixed(0)} min ${state.eta % 60} s`
      var progress = state.percentage.toFixed(0) + '%'

      spinner.tick( state.delta, `${progress} | ${speed}/s | ${eta}` )

    })

    request( IMAGE_URL, ( error, response ) => {

      if( error ) throw error
      if( response.statusCode !== 200 ) {
        throw new Error( `HTTP ${response.statusCode}` )
      }

      response
        .on( 'error', onError )
        .pipe( measure )
        .pipe( dest )
        .on( 'error', onError )
        .once( 'finish', () => {
          console.log( 'fetch:finish' )
          this.imageSize = fs.statSync( this.filename ).size
          console.log( 'flashing', path.basename( this.filename ), `(${prettybytes(this.imageSize)})` )
          this.emit( 'ready' )
        })

    })

  }

  start() {
    debug( 'start' )
  }

  flash(drive) {

    if( this.processes.has( drive.device ) ) {
      var proc = this.processes.get( drive.device )
      debug( 'update:bail', proc.drive )
      return
    }

    var proc = new Process()
    // var barFormat = `[:bar] :mode ${drive.device} | ${color.x87(':progress')} | ${color.green(':speed/s')} | ${color.x247('ETA :remaining')}`
    var barFormat = `[:bar] :message`
    var image = {
      stream: fs.createReadStream( this.filename ),
      size: {
        original: this.imageSize,
        final: {
          estimation: false,
          value: this.imageSize,
        },
      },
    }

    proc.drive = drive
    proc.spinner = progress.createGauge( barFormat, {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: this.imageSize * 2,
      clear: true,
      callback: () => {
        progressOutput.clearLine(0)
        progressOutput.cursorTo(0)
      }
    })

    proc.spinner.tick( 0, `[DETECTED] ${drive.device}` )

    var onUnmount = () => {

      // proc.fd = fs.openSync( drive.raw, 'rs+' )
      proc.writer = new ImageWriter({
        image: image,
        // fd: proc.fd,
        flags: 'rs+',
        path: drive.raw,
        verify: true,
        checksumAlgorithms: [ 'crc32' ]
      })

      proc.writer.on( 'error', (error) => {
        error.device = drive.device
        this.emit( 'error', error )
        proc.spinner.tick( 0, `[ERROR] ${error.message}`)
        setTimeout(() => {
          proc.spinner.remove()
        }, 3e3 )
        this.processes.delete( drive.device )
      })
      .on( 'progress', (state) => {
        debug( 'progress', state )

        var mode = state.type === 'write' ?
          color.red_bt(' WRITE') :
          color.yellow('VERIFY')
        var speed = prettybytes( state.speed )
        var eta = `${(state.eta / 60).toFixed(0)} min ${state.eta % 60} s`
        var progress = state.percentage.toFixed(0) + '%'

        proc.spinner.tick( state.delta, `${mode} ${drive.device} | ${progress} | ${speed}/s | ${eta}` )

      })
      .on( 'finish', () => {
        debug( 'finish' )
        if( proc.fd ) fs.close( proc.fd, () => {})
        proc.spinner.tick( 1, '[FINISHED]')
        mountutils.unmountDisk( drive.device, (error) => {
          debug( 'unmount:finish', error || `OK ${proc.drive.device}` )
          if( error ) this.emit( 'error', error )
          proc.spinner.tick( 1, `[UNMOUNTED] ${drive.device}`)
          setTimeout(() => {
            this.processes.delete( drive.device )
            proc.spinner.remove()
          }, 10e3)
        })
      })

    }

    this.processes.set( drive.device, proc )

    mountutils.unmountDisk( drive.device, (error) => {
      debug( 'start:unmount', error || `OK ${proc.drive.device}` )
      if( error ) this.emit( 'error', error )
      onUnmount()
      process.nextTick(() => {
        proc.writer.write()
      })
    })

  }

  update(drives) {

    var newDrives = _.differenceBy( drives, this.currentDrives, 'device' )

    newDrives.forEach((drive) => {
      if( drive != null ) {
        // if( isResinOS( drive ) ) {
        //   debug( 'bail:isResinOS', drive.device )
        //   return
        // }
        // if( drive.mountpoints.length === 0 ) {
        //   debug( 'bail:unmounted', drive.device )
        //   return
        // }
        this.flash( drive )
      }
    })

    this.currentDrives = drives

  }

}

class Process {

  constructor() {
    this.drive = null
    this.writer = null
  }

}

var hub = new Hub()

hub.on('error', (error) => {
  debug( 'error', error )
})
