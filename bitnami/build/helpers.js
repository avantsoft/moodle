'use strict';

const _ = require('lodash');

const php = $modules['com.bitnami.php'];
const confFile = $file.join($app.installdir, 'config.php');

// Moodle plugin folder list - https://docs.moodle.org/dev/Plugin_types
$app.moodlePluginDirs = {
  mod: 'mod',
  lib_antivirus: $file.join('lib', 'antivirus'),
  mod_assign_submission: $file.join('mod', 'assign', 'submission'),
  mod_assign_feedback: $file.join('mod', 'assign', 'feedback'),
  mod_book_tool: $file.join('mod', 'book', 'tool'),
  mod_data_field: $file.join('mod', 'data', 'field'),
  mod_data_preset: $file.join('mod', 'data', 'preset'),
  mod_lti_source: $file.join('mod', 'lti', 'source'),
  files_converter: $file.join('files', 'converter'),
  mod_lti_service: $file.join('mod', 'lti', 'service'),
  lib_mlbackend: $file.join('lib', 'mlbackend'),
  mod_quiz_report: $file.join('mod', 'quiz', 'report'),
  mod_quiz_accessrule: $file.join('mod', 'quiz', 'accessrule'),
  mod_scorm_report: $file.join('mod', 'scorm', 'report'),
  mod_workshop_form: $file.join('mod', 'workshop', 'form'),
  mod_workshop_allocation: $file.join('mod', 'workshop', 'allocation'),
  mod_workshop_eval: $file.join('mod', 'workshop', 'eval'),
  blocks: 'blocks',
  question_type: $file.join('question', 'type'),
  question_behaviors: $file.join('question', 'behaviour'),
  question_format: $file.join('question', 'format'),
  filter: 'filter',
  editor: $file.join('lib', 'editor'),
  atto_editor_plugin: $file.join('lib', 'editor', 'atto', 'plugins'),
  tinymce_editor_plugin: $file.join('lib', 'editor', 'tinymce', 'plugins'),
  enrol: 'enrol',
  auth: 'auth',
  admin_tool: $file.join('admin', 'tool'),
  admin_tool_log_store: $file.join('admin', 'tool', 'log', 'store'),
  availability_conditions: $file.join('availability', 'condition'),
  calendar_type: $file.join('calendar', 'type'),
  message_output: $file.join('message', 'output'),
  course_format: $file.join('course', 'format'),
  dataformat: 'dataformat',
  user_profile_field: $file.join('user', 'profile', 'field'),
  report: 'report',
  course_report: $file.join('course', 'report'),
  grade_export: $file.join('grade', 'export'),
  grade_import: $file.join('grade', 'import'),
  grade_report: $file.join('grade', 'report'),
  grade_method: $file.join('grade', 'grading', 'form'),
  mnet_service: $file.join('mnet', 'service'),
  webservice: 'webservice',
  repository: 'repository',
  portfolio: 'portfolio',
  search_engine: $file.join('search', 'engine'),
  media_player: $file.join('media', 'player'),
  plagiarism: 'plagiarism',
  cache_store: $file.join('cache', 'stores'),
  cache_locks: $file.join('cache', 'locks'),
  theme: 'theme',
  local: 'local',
  mod_assignment_type: $file.join('mod', 'assignment', 'type'),
  admin_reports: $file.join('admin', 'reports.php'),
  admin_tools: $file.join('admin', 'tools.php'),
  moodledata: $app.moodleDataDir,
};

$app.helpers.runMoodleInstall = function(databaseHandler) {
  const installArgs = [
    `--lang=${$app.defaultDataLanguage}`,
    '--chmod=2775',
    '--wwwroot=http://localhost:80',
    `--dataroot=${$app.moodlePluginDirs.moodledata}`,
    '--dbtype=mariadb',
    `--dbhost=${databaseHandler.connection.host}`,
    `--dbport=${databaseHandler.connection.port}`,
    `--dbname=${databaseHandler.connection.name}`,
    `--dbuser=${databaseHandler.connection.user}`,
    `--dbpass=${databaseHandler.connection.password}`,
    `--adminuser=${$app.username}`,
    `--adminpass=${$app.password}`,
    `--adminemail=${$app.email}`,
    `--fullname="${$app.moodleSiteName}"`,
    `--shortname="${$app.moodleSiteName}"`,
    '--non-interactive',
    '--skip-database',
    '--allow-unstable',
    '--agree-license'];
  php.execute('admin/cli/install.php', installArgs, {cwd: $app.installdir});
};

$app.helpers.configureURL = function(webserverHandler) {
  const wwwrootSubsValue = `if (empty($_SERVER['HTTP_HOST'])) {
 $_SERVER['HTTP_HOST'] = '127.0.0.1:${webserverHandler.httpPort}';
    }

    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] == 'on') {
 $CFG->wwwroot   = 'https://' . $_SERVER['HTTP_HOST'];
    } else {
 $CFG->wwwroot   = 'http://' . $_SERVER['HTTP_HOST'];
    }`;

  $file.substitute(
    'config.php',
    /\$CFG->wwwroot\s+=\s+'http:\/\/localhost:80'/,
    wwwrootSubsValue,
    {abortOnUnmatch: true, type: 'regexp', global: true}
  );

  $file.substitute('config.php', /__DIR__/, `'${$app.installdir}'`);
};

$app.helpers.setNoReplyAddress = function(email, databaseHandler) {
  databaseHandler.database(databaseHandler.connection.name).insert('mdl_config', [
    {id: null, name: 'noreplyaddress', value: email},
  ]);
};

$app.helpers.setAdminEmail = function(databaseHandler) {
  databaseHandler.database(databaseHandler.connection.name).set('mdl_user', 'email', $app.email, {condition: 'id=2'});
};

$app.helpers.setCourseSummary = function(databaseHandler) {
  databaseHandler.database(databaseHandler.connection.name)
    .set(
      'mdl_course',
      'summary',
      'Moodle powered by Bitnami',
      {condition: 'id=1'}
    );
};

$app.helpers.getDatabaseProperties = function() {
  const confText = $file.read(confFile);
  const varMapping = {
    database: 'dbname',
    username: 'dbuser',
    password: 'dbpass',
    host: 'dbhost',
    port: 'dbport',
    type: 'dbtype',
  };
  const result = {};
  _.each(varMapping, (value, key) => {
    result[key] = confText.match(new RegExp(`^\\s*.*[>']?${value}[']?\\s*=[>]?\\s*[']?([^,;']*)[']?`, 'm'))[1];
  });
  return result;
};

$app.helpers.configureSMTP = function(databaseHandler) {
  const smtpProperties = [$app.smtpUser, $app.smtpPassword, $app.smtpHost, $app.smtpPort];
  if (!smtpProperties.some(_.isEmpty)) {
    const configuration = {
      smtphosts: `${$app.smtpHost}:${$app.smtpPort}`,
      smtpuser: $app.smtpUser,
      smtppass: $app.smtpPassword,
      noreplyaddress: $app.smtpUser,
      smtpsecure: $app.smtpProtocol,
    };
    _.forEach(configuration, (value, key) => {
      databaseHandler.database(databaseHandler.connection.name)
        .set(
          'mdl_config',
          'value',
          value,
          {where: {name: key}}
        );
    });
  } else if (!smtpProperties.every(_.isEmpty)) {
    throw new Error('You should specify username, password, host, port for SMTP configuration');
  }
};
