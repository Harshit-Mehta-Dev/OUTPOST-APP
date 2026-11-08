# ==============================================================================
# Puppet Master Site Manifest for OUTPOST Multi-Tier Architecture
# Enforces Desired State Configuration across Nodes
# ==============================================================================

node default {
  include outpost::base
}

node /^api\d+\.outpost\.internal$/ {
  include outpost::base
  include outpost::app
  include outpost::security
  include outpost::monitoring
}

node /^edge\d+\.outpost\.internal$/ {
  include outpost::base
  include outpost::edge
}

node /^mon\d+\.outpost\.internal$/ {
  include outpost::base
  include outpost::nagios_server
}
