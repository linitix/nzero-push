var NotifyEndpoint         = require("./notify_endpoint");
var RegisterEndpoint       = require("./register_endpoint");
var BroadcastEndpoint      = require("./broadcast_endpoint");
var UnregisterEndpoint     = require("./unregister_endpoint");
var InactiveTokensEndpoint = require("./inactive_tokens_endpoint");
var SetBadgeEndpoint       = require("./set_badge_endpoint");
var ChannelsEndpoint       = require("./channels_endpoint");
var ChannelEndpoint        = require("./channel_endpoint");
var DeleteChannelsEndpoint = require("./delete_channels_endpoint");

module.exports = {
  notify        : NotifyEndpoint,
  register      : RegisterEndpoint,
  broadcast     : BroadcastEndpoint,
  unregister    : UnregisterEndpoint,
  inactiveTokens: InactiveTokensEndpoint,
  setBadge      : SetBadgeEndpoint,
  channels      : ChannelsEndpoint,
  channel       : ChannelEndpoint,
  deleteChannels: DeleteChannelsEndpoint
};
