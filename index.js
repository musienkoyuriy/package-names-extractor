#!/usr/bin/node

;
(function(context) {
  'use strict'

  var fs = require('fs')
  var path = require('path')

  var projectFolderPath = process.cwd()
  var npmConfig = getNpmConfig(projectFolderPath)
  var modulesFolder = path.resolve(projectFolderPath, 'dasads')

  fs.lstat(modulesFolder, function(err, stats) {
    var resultConfig = npmConfig
    var modules
    if (err) throw new Error('There is no "node_modules" directory')
    if (!stats.isDirectory()) return false
    fs.readdir(modulesFolder, function(err, files) {
      if (err) throw err
      modules = files
        .map(getNodeModules)
        .filter(filterNotEmptyObject)
        .forEach(function(nodeModule) {
          var deps = getDependenciesFromNpmConfig(npmConfig)
          var dependenciesProp
          if (
            !deps.dependencies[nodeModule.name] &&
            !deps.devDependencies[nodeModule.name]
          ) {
            if (npmConfig.dependencies) {
              resultConfig.dependencies[nodeModule.name] = nodeModule.version
            } else {
              resultConfig['dependencies'] = {}
              Object.defineProperty(resultConfig.dependencies, nodeModule.name, {
                enumerable: true,
                writable: true,
                configurable: true,
                value: nodeModule.version
              })
            }
    		  }
        })
        writeToNpmConfigFile(resultConfig)
    })
  })

  function getNodeModules(file) {
    if (!isSubFolderIsModule(modulesFolder, file)) return {}
    return {
      name: file,
      version: pullPackageVersion(path.resolve(modulesFolder, file, 'package.json'))
    }
  }

  function filterNotEmptyObject(nodeModule) {
    if (typeof nodeModule !== 'object') return
    return Object.keys(nodeModule).length > 0
  }

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

  function writeToNpmConfigFile(npmConfig) {
    fs.writeFile(path.resolve(projectFolderPath, 'package.json'), JSON.stringify(npmConfig, null, 2), function(err, content) {
      if (err) throw err
      console.log('package.json has been updated')
    })
  }

  function getNpmConfig(projectFolderPath) {
    var npmConfigPath = path.join(projectFolderPath, 'package.json')
    var isNpmConfigExists = fs.existsSync(npmConfigPath)
    var config

    if (!isNpmConfigExists) throw new Error('There is no "package.json" file in your project folder')

    try {
      config = fs.readFileSync(npmConfigPath, 'utf-8')
      config = JSON.parse(config);
    } catch(ex) { }

    return typeof config === 'object' ? config : {}
  }

  function getDependenciesFromNpmConfig(config) {
    return {
      dependencies: ('dependencies' in config) ? config.dependencies : {},
      devDependencies: ('devDependencies' in config) ? config.devDependencies : {}
    }
  }
})(global)
