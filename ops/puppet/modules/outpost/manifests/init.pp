# ==============================================================================
# Puppet Module: outpost
# Core Declarative State Resource Management
# ==============================================================================

class outpost::base {
  # Base System User & Security Hardening
  group { 'deploy':
    ensure => present,
    gid    => 1050,
  }

  user { 'deploy':
    ensure     => present,
    uid        => 1050,
    gid        => 'deploy',
    home       => '/home/deploy',
    managehome => true,
    shell      => '/bin/bash',
  }

  package { ['curl', 'git', 'jq', 'tar', 'unzip', 'ufw']:
    ensure => installed,
  }

  # Kernel Parameters / Limits
  file { '/etc/security/limits.d/99-outpost.conf':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => "deploy soft nofile 65535\ndeploy hard nofile 65535\n",
  }
}

class outpost::app {
  $app_root = '/opt/outpost-app'

  file { $app_root:
    ensure => directory,
    owner  => 'deploy',
    group  => 'deploy',
    mode   => '0755',
  }

  file { '/etc/systemd/system/outpost-app.service':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0644',
    content => @(EOF)
      [Unit]
      Description=OUTPOST High-Performance Backend Service
      After=network.target

      [Service]
      Type=simple
      User=deploy
      WorkingDirectory=/opt/outpost-app
      ExecStart=/usr/bin/node server/server.js
      Restart=always
      RestartSec=5
      Environment=NODE_ENV=production
      Environment=PORT=5000

      [Install]
      WantedBy=multi-user.target
      EOF
    notify  => Exec['systemd-daemon-reload'],
  }

  exec { 'systemd-daemon-reload':
    command     => '/bin/systemctl daemon-reload',
    refreshonly => true,
  }

  service { 'outpost-app':
    ensure    => running,
    enable    => true,
    subscribe => File['/etc/systemd/system/outpost-app.service'],
  }
}

class outpost::security {
  # Enforce D.I.S.M.W Security Configuration State
  file { '/opt/outpost-app/server/security/dismw':
    ensure  => directory,
    owner   => 'deploy',
    group   => 'deploy',
    mode    => '0750',
    require => Class['outpost::app'],
  }

  file { '/etc/outpost-security.conf':
    ensure  => file,
    owner   => 'root',
    group   => 'root',
    mode    => '0600',
    content => "DISMW_MODE=ARMED_AEGIS\nSCOUT_VAULT=AES_256_CBC\nSCOUT_GUARDIAN_SUBNETS=ACTIVE\n",
  }
}

class outpost::monitoring {
  package { ['nagios-nrpe-server', 'nagios-plugins']:
    ensure => installed,
  }

  service { 'nagios-nrpe-server':
    ensure  => running,
    enable  => true,
    require => Package['nagios-nrpe-server'],
  }
}

class outpost::edge {
  package { 'nginx':
    ensure => installed,
  }

  service { 'nginx':
    ensure  => running,
    enable  => true,
    require => Package['nginx'],
  }
}

class outpost::nagios_server {
  package { ['nagios4', 'nagios-plugins']:
    ensure => installed,
  }

  service { 'nagios4':
    ensure  => running,
    enable  => true,
    require => Package['nagios4'],
  }
}
