class Meter {

  constructor(stream) {
    this.stream = stream
    this.gauges = new Set()
    this.content = ''
    this.lines = 0
    setInterval(() => {
      this.render()
    }, 300)
    this.render()
  }

  createGauge( format, options ) {
    var gauge = new Meter.Gauge( format, options )
    gauge.meter = this
    this.gauges.add( gauge )
    return gauge
  }

  render() {

    for( var i = 0; i < this.lines - 1; i++ ) {
      this.stream.clearLine(0)
      this.stream.moveCursor(0,-1)
    }

    this.content = ''
    this.gauges.forEach((gauge) => {
      this.content += gauge.render() + '\n'
    })

    this.lines = this.content.split( /\r?\n/g ).length
    this.stream.cursorTo(0)
    this.stream.write(this.content)

  }

  remove(gauge) {
    this.gauges.delete(gauge)
  }

}

Meter.Gauge = class Gauge {

  constructor(format, options) {

    this.format = format
    this.width = options.width || 20
    this.value = options.value || 0
    this.total = options.total || 1
    this.chars = {
      complete: options.complete || '=',
      incomplete: options.incomplete || '-',
      head: options.head || ( options.complete || '=' ),
    }

    this.meter = null
    this.message = ''
    this.content = ''
    this.needsUpdate = true

  }

  tick( delta, message ) {
    this.needsUpdate = true
    this.value += delta
    this.message = message || this.message
  }

  render() {

    if( !this.needsUpdate )
      return this.content

    var ratio = this.value / this.total
    ratio = Math.min( Math.max( ratio, 0 ), 1 )

    var percent = Math.floor( ratio * 100 )
    var completeLength = Math.round( this.width * ratio )
    var complete = ''
    var incomplete = ''

    complete = Array(Math.max(0, completeLength + 1))
      .join(this.chars.complete)

    incomplete = Array(Math.max(0, this.width - completeLength + 1))
      .join(this.chars.incomplete)

    if( completeLength > 0 ) {
      complete = complete.slice(0, -1) + this.chars.head
    }

    this.needsUpdate = false
    this.content = this.format.replace( ':bar', complete + incomplete )
    this.content = this.content.replace( ':message', this.message )

    return this.content

  }

  remove() {
    this.meter.remove(this)
  }

}

module.exports = Meter
