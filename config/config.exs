# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# Configures the endpoint
config :chat, Chat.Endpoint,
  url: [host: "localhost"],
  check_origin: ["https://stark-anchorage-62238.herokuapp.com/"],
  secret_key_base: "7bp3TD8knS0N0FFWxdox6Jj2fuLvvESt5K9soW0hk1blGQxLZztSRB1QK3tQ653T",
  render_errors: [view: Chat.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Chat.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
