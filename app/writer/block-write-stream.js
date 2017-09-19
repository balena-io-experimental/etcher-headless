/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

const _ = require('lodash')
const stream = require('readable-stream')
const fs = require('fs')
const debug = require('debug')('block-write-stream')

/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-magic-numbers */

const CHUNK_SIZE = 64 * 1024

/**
 * @summary BlockWriteStream
 * @class
 */
class BlockWriteStream extends stream.Writable {
  /**
   * @summary BlockReadStream constructor
   * @param {Object} [options] - options
   * @param {Number} [options.fd] - file descriptor
   * @param {String} [options.path] - file path
   * @param {String} [options.flags] - file open flags
   * @param {Number} [options.mode] - file mode
   * @param {Boolean} [options.autoClose] - automatically close the stream on end
   * @example
   * new BlockWriteStream(options)
   */
  constructor (options) {
    options = _.assign({}, BlockWriteStream.defaults, options)
    options.objectMode = true

    debug('block-write-stream %j', options)

    super(options)

    this._writableState.highWaterMark = 1

    this.fs = options.fs
    this.fd = options.fd
    this.path = options.path
    this.flags = options.flags
    this.mode = options.mode
    this.autoClose = options.autoClose

    this.position = 0
    this.bytesRead = 0
    this.blocksRead = 0
    this.bytesWritten = 0
    this.blocksWritten = 0

    this.closed = false
    this.destroyed = false

    this.once('finish', function () {
      if (this.autoClose) {
        this.close()
      }
    })

    this._flushing = false
    this._firstBlocks = []

    this.open()
  }

  /**
   * @summary Internal write handler
   * @private
   * @param {Buffer} chunk - chunk buffer
   * @param {String} encoding - chunk encoding
   * @param {Function} next - callback(error, value)
   * @example
   * // Not to be called directly
   */
  _write (chunk, encoding, next) {
    // Wait for file handle to be open
    if (_.isNil(this.fd)) {
      this.once('open', () => {
        this._write(chunk, encoding, next)
      })
      return
    }

    this.bytesRead += chunk.length
    this.blocksRead += 1

    if (_.isNil(chunk.position)) {
      chunk.position = this.position
    }

    if (!this._flushing && (chunk.position < CHUNK_SIZE)) {
      this._firstBlocks.push(chunk)
      this.position = chunk.position + chunk.length
      process.nextTick(next)
      return
    }

    if (chunk.position !== this.position) {
      this.position = chunk.position
    }

    debug('_write', chunk.length, chunk.position, chunk.address)

    fs.write(this.fd, chunk, 0, chunk.length, chunk.position, (error, bytesWritten) => {
      this.bytesWritten += bytesWritten
      this.blocksWritten += 1
      this.position += bytesWritten
      next(error)
    })
  }

  /**
   * [_final description]
   * @param {Function} done
   */
  _final (done) {
    debug('_final')

    /**
     * [description]
     * @param  {[type]} error [description]
     * @return {[type]}       [description]
     */
    const writeNext = (error) => {
      if (error) {
        this.destroy(error)
        return
      }
      const chunk = this._firstBlocks.pop()
      if (!chunk) {
        done()
        return
      }
      this._write(chunk, null, writeNext)
    }

    this._flushing = true
    writeNext()
  }

  /**
   * [_destroy description]
   * @param {Error}   [error]
   * @param {Function} done
   */
  _destroy (error, done) {
    debug('_destroy', error)

    // TODO: Figure out how the error handling works here
    if (this.autoClose) {
      this.close(done)
    } else {
      done()
    }
  }

  /**
   * @summary Open a handle to the file
   * @private
   * @example
   * this.open()
   */
  open () {
    debug('open')

    if (!_.isNil(this.fd)) {
      this.emit('open', this.fd)
      return
    }

    this.fs.open(this.path, this.flags, this.mode, (error, fd) => {
      if (error) {
        if (this.autoClose) {
          this.destroy()
        }
        this.emit('error', error)
      } else {
        this.fd = fd
        this.emit('open', fd)
      }
    })
  }

  /**
   * @summary Close the underlying resource
   * @param {Function} callback - callback(error)
   * @example
   * blockStream.close((error) => {
   *   // ...
   * })
   */
  close (callback) {
    debug('close')

    if (callback) {
      this.once('close', callback)
    }

    if (this.closed || _.isNil(this.fd)) {
      if (_.isNil(this.fd)) {
        this.once('open', () => {
          this.close()
        })
      } else {
        process.nextTick(() => {
          this.emit('close')
        })
      }
      return
    }

    this.closed = true

    this.fs.close(this.fd, (error) => {
      if (error) {
        this.emit('error', error)
      } else {
        this.emit('close')
      }
    })

    this.fd = null
  }
}

/**
 * @summary Default options
 * @type {Object}
 * @constant
 */
BlockWriteStream.defaults = {
  fs,
  fd: null,
  path: null,
  flags: 'w',
  mode: 0o666,
  autoClose: true
}

module.exports = BlockWriteStream
