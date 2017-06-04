defmodule Chat.UserSocket do
  use Phoenix.Socket

  channel "rooms:*", Chat.RoomChannel

  transport :websocket, Phoenix.Transports.WebSocket
  transport :longpoll, Phoenix.Transports.LongPoll

  def connect(params, socket) do
    socket = assign(socket, :user_id, params["id"])
    socket = assign(socket, :player_data, %{})
    {:ok, socket}
  end

  def id(socket) do
    "#{socket.assigns.user_id}"
  end
end
