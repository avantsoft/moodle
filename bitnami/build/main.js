'use strict';

const _ = require('lodash');

const php = $modules['com.bitnami.php'];
const volumeFunctions = require('./lib/volume')($app);
const handlerSelector = require('./lib/handlers/selector');
const componentFunctions = require('./lib/component')($app);

$app.postInstallation = function() {
  const webserverHandler = handlerSelector.getHandler('webServer', 'apache', {cwd: $app.installdir});
  if (!volumeFunctions.isInitialized($app.persistDir)) {
    $file.mkdir($app.moodlePluginDirs.moodledata);
    const databaseHandler = handlerSelector.getHandler('database', {
      variation: 'mariadb',
      name: $app.databaseName,
      user: $app.databaseUser,
      password: $app.databasePassword,
      host: $app.databaseServerHost,
      port: $app.databaseServerPort,
    }, {cwd: $app.installdir});
    databaseHandler.checkConnection();
    $app.debug('Preparing apache environment...');
    webserverHandler.addAppVhost('moodle', {type: 'php'});
    $app.info('Running Moodle install. Please be patient...');
    $app.helpers.runMoodleInstall(databaseHandler);
    $app.helpers.configureURL(webserverHandler);
    $app.helpers.setNoReplyAddress('noreply@moodle', databaseHandler);
    $app.helpers.setAdminEmail(databaseHandler);
    $app.helpers.setCourseSummary(databaseHandler);
    $app.helpers.configureSMTP(databaseHandler);
    volumeFunctions.prepareDataToPersist($app.dataToPersist);
    $app.debug('Configuring PHP settings...');
    php.configure([
      {name: 'opcache.enable', value: 'Off'},
    ]);
  } else {
    $app.debug('Existing installation, restoring...');
    volumeFunctions.restorePersistedData($app.dataToPersist);
    const databaseInfo = $app.helpers.getDatabaseProperties();
    const databaseHandler = handlerSelector.getHandler('database', {
      variation: databaseInfo.type,
      user: databaseInfo.username,
      password: databaseInfo.password,
      host: databaseInfo.host,
      port: !_.isUndefined(databaseInfo.port) ? databaseInfo.port : $app.databaseServerPort,
    }, {cwd: $app.installdir});
    databaseHandler.checkConnection();
    php.execute(
      'admin/cli/upgrade.php',
      ['--non-interactive', '--allow-unstable'],
      {cwd: $app.installdir}
    );
    $file.delete($file.join($app.moodlePluginDirs.moodledata, 'sessions/*'), {deleteDirs: false});
  }

  $app.info('Configuring Cron Jobs...');
  const cronCommand = `${$file.join(php.binDir, 'php')} `
  + `${$file.join($app.installdir, 'admin/cli/cron.php')} > /dev/null`;
  componentFunctions.createExtraConfigurationFiles({
    type: 'cron',
    path: $app.cronFile,
    params: {
      runAs: $app.nonRootSystemUser,
      cronJobs: [{
        command: `sudo su ${webserverHandler.user} -s /bin/sh -c "${cronCommand}"`,
        cronTime: '*/1 * * * *',
      }],
    },
  });
  const pluginsDirOwner = $os.userExists($app.nonRootSystemUser) ? $app.nonRootSystemUser : webserverHandler.user;
  componentFunctions.configurePermissions(_.values($app.moodlePluginDirs), {
    user: pluginsDirOwner,
    group: webserverHandler.group,
    mod: '775',
  });

  componentFunctions.configurePermissions(
    $file.join($app.installdir, 'config.php'),
    {
      user: $app.nonRootSystemUser,
      group: webserverHandler.group,
      mod: '640',
    }
  );
  componentFunctions.configurePermissions(
    $file.join($app.installdir, 'local'),
    {
      user: $app.nonRootSystemUser,
      group: webserverHandler.group,
      mod: '775',
    },
    {recursive: true}
  );

  componentFunctions.printProperties({
    Username: $app.username,
    Password: $app.password,
    Email: $app.email,
  });
};
