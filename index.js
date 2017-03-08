'use strict'
const BTCfee = require('bitcoin-fee')
const pRetry = require('p-retry')
const median = require('median')

const fees = {}

queryFees()
setInterval(queryFees, 2 * 60 * 1000).unref()

function queryFees () {
  BTCfee.SERVICES.forEach((service, i) => {
    BTCfee.fetchFee(service)
    .then(fee => {
      if (!fee) return
      fees[service] = fee
    })
    .catch(() => {})
  })
}

exports.fetchHigh = function () {
  return getFeeList().then(arr => arr.reduce((highest, fee) => fee > highest ? fee : highest, 0))
}

exports.fetchLow = function () {
  return getFeeList().then(arr => arr.reduce((lowest, fee) => fee < lowest ? fee : lowest, 0))
}

exports.fetchMean = function () {
  return getFeeList().then(arr => arr.reduce((t, i) => t + i, 0) / arr.length)
}

exports.fetchMedian = function () {
  return getFeeList().then(median)
}

function getFeeList () {
  function run () {
    return new Promise((resolve, reject) => {
      let feeList = Object.keys(fees).map(key => fees[key])
      if (!feeList.length) reject(new Error('No response from underlying APIs'))
      resolve(feeList)
    })
  }
  // Retry every second for 30 seconds:
  return pRetry(run, {retries: 30, maxTimeout: 1000})
}