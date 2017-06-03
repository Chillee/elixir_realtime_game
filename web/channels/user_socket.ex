defmodule Chat.UserSocket do
  use Phoenix.Socket

  channel "rooms:*", Chat.RoomChannel

  transport :websocket, Phoenix.Transports.WebSocket
  transport :longpoll, Phoenix.Transports.LongPoll

  def connect(params, socket) do
    {:ok, assign(socket, :user_id, params["id"])}
  end

  def id(socket) do
    "#{socket.assigns.user_id}"
  end
end
