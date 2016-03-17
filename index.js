#!/usr/bin/node

;
(function() {
  'use strict'

  var fs = require('fs')
  var path = require('path')

  var projectFolderPath = process.cwd()
  var modulesFolder = path.resolve(projectFolderPath, 'node_modules')

  fs.lstat(modulesFolder, function(err, stats) {
    var modules
    if (err) throw new Error('There is no "node_modules" directory')
    if (!stats.isDirectory()) return false
    fs.readdir(modulesFolder, function(err, files) {
      if (err) throw err
      modules = files
        .map(function(file) {
          if (!isSubFolderIsModule(modulesFolder, file)) return {}
          return {
            name: file,
            version: pullPackageVersion(path.resolve(modulesFolder, file, 'package.json'))
          }
        })
        .filter(function(nodeModule) {
          return Object.keys(nodeModule).length > 0
        })
    })
  })

  function pullPackageVersion(modulePath) {
    var packageContent = fs.readFileSync(modulePath, 'utf-8')
    return JSON.parse(packageContent).version
  }

  function isSubFolderIsModule(modulesFolder, file) {
    var normalizedFilePath = path.resolve(modulesFolder, file)
    var filesStat = fs.lstatSync(normalizedFilePath)

    if (!filesStat.isDirectory()) return false

    return fs.existsSync(path.join(normalizedFilePath, 'package.json'))
  }
})()
