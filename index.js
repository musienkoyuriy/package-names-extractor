#!/usr/bin/node

;
(function(context) {
  'use strict'

  var fs = require('fs')
  var path = require('path')

  var projectFolderPath = process.cwd()
  var npmConfig = getNpmConfig(projectFolderPath)
  var modulesFolder = path.resolve(projectFolderPath, 'node_modules')

  fs.lstat(modulesFolder, function(err, stats) {
    var modules
    if (err) throw new Error('There is no "node_modules" directory')
    if (!stats.isDirectory()) return false
    fs.readdir(modulesFolder, function(err, files) {
      if (err) throw err
      modules = files
        .map(getNodeModules)
        .filter(filterNotEmptyObject)
        .forEach(generateJSON)

      writeToNpmConfigFile(npmConfig)
    })
  })

 /**
 * Returns an object related to folder which contains a package.json
 * @param  {String} file
 * @returns {Object}
 */

  function getNodeModules(file) {
    if (!isSubFolderIsModule(modulesFolder, file)) return {}
    return {
      name: file,
      version: pullPackageVersion(path.resolve(modulesFolder, file, 'package.json'))
    }
  }

/**
 * Generates json for package.json dependencies
 * @param  {Object} nodeModule
 * @returns undefined
 */

  function generateJSON(nodeModule) {
    var deps = getDependenciesFromNpmConfig(npmConfig)
    var dependenciesProp
    if (
      !deps.dependencies[nodeModule.name] &&
      !deps.devDependencies[nodeModule.name]
    ) {
      if (npmConfig.dependencies) {
        npmConfig.dependencies[nodeModule.name] = nodeModule.version
      } else {
        npmConfig['dependencies'] = {}
        Object.defineProperty(npmConfig.dependencies, nodeModule.name, {
          enumerable: true,
          writable: true,
          configurable: true,
          value: nodeModule.version
        })
      }
    }
  }

/**
 * Returns boolean as per not-empty object
 * @param  {Object} nodeModule
 * @returns {Boolean}
 */

  function filterNotEmptyObject(nodeModule) {
    if (typeof nodeModule !== 'object') return
    return Object.keys(nodeModule).length > 0
  }

/**
 * Gets a package's version
 * @param  {String} modulePath
 * @returns {Object}
 */

  function pullPackageVersion(modulePath) {
    var packageContent = fs.readFileSync(modulePath, 'utf-8')
    return JSON.parse(packageContent).version
  }

/**
 * Returns true if file is module and false if not
 * @param  {String}  modulesFolder
 * @param  {String}  file
 * @returns {Boolean}
 */

  function isSubFolderIsModule(modulesFolder, file) {
    var normalizedFilePath = path.resolve(modulesFolder, file)
    var filesStat = fs.lstatSync(normalizedFilePath)

    if (!filesStat.isDirectory()) return false

    return fs.existsSync(path.join(normalizedFilePath, 'package.json'))
  }

/**
 * Writes dependencies to the npm config of project that uses this util
 * @param  {Object} npmConfig
 * @returns undefined
 */

  function writeToNpmConfigFile(npmConfig) {
    fs.writeFile(path.resolve(projectFolderPath, 'package.json'), JSON.stringify(npmConfig, null, 2), function(err, content) {
      if (err) throw err
      console.log('package.json has been updated')
    })
  }

/**
 * Gets content of package.json file
 * @param  {String} projectFolderPath
 * @returns {Object}
 */

  function getNpmConfig(projectFolderPath) {
    var npmConfigPath = path.join(projectFolderPath, 'package.json')
    var isNpmConfigExists = fs.existsSync(npmConfigPath)
    var config

    if (!isNpmConfigExists) throw new Error('There is no "package.json" file in your project folder')

    try {
      config = fs.readFileSync(npmConfigPath, 'utf-8')
      config = JSON.parse(config)
    } catch(ex) { }

    return typeof config === 'object' ? config : {}
  }

/**
 * Gets object which dependencies and devDependencies
 * @param  {String} config
 * @returns undefined
 */

  function getDependenciesFromNpmConfig(config) {
    return {
      dependencies: config.dependencies || {},
      devDependencies: config.devDependencies || {}
    }
  }
})(global)
