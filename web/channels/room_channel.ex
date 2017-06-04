defmodule Chat.RoomChannel do
  use Phoenix.Channel
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic

  Possible Return Values

  `{:ok, socket}` to authorize subscription for channel for requested topic

  `:ignore` to deny subscription/broadcast on this channel
  for the requested topic
  """
  def join("rooms:lobby", message, socket) do
    Process.flag(:trap_exit, true)
    send(self(), {:after_join, message})
    {:ok, socket}
  end

  def handle_info({:after_join, msg}, socket) do
    push socket, "join", %{status: "connected"}
    push socket, "world_data", %{players: Chat.WorldState.val()}
    {:noreply, socket}
  end

  def terminate(reason, socket) do
    Logger.debug"> leave #{inspect reason}"
    broadcast! socket, "remove_player", %{user_id: socket.assigns.user_id}
    Chat.WorldState.insert(socket.assigns.player_state);
    :ok 
  end

  def handle_in("update_pos", msg, socket) do
    broadcast! socket, "update_pos", %{x: msg["x"], y: msg["y"], user_id: msg["user_id"]}
    {:reply, :ok, assign(socket, :player_state, %{x: msg["x"], y: msg["y"]})}
  end
end
