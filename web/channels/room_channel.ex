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
    push socket, "init_data", %{blocks: Chat.BlockState.val(), id: :rand.uniform(100000), team: 0}
    {:noreply, socket}
  end

  def terminate(reason, socket) do
    Logger.debug"> leave #{inspect reason}"
    send(self(), {"sudoku", socket.assigns.player_data, socket})
    :ok 
  end

  def handle_in("sudoku", msg, socket) do
    broadcast! socket, "remove_player", %{data: msg, new_id: :rand.uniform(100000)}
    broadcast! socket, "add_block", msg
    Chat.BlockState.insert(msg);
    {:reply, :ok, socket}
  end

  def handle_in("death", msg, socket) do
    broadcast! socket, "remove_player", %{data: msg, new_id: :rand.uniform(100000)}
    {:reply, :ok, socket}
  end

  def handle_in("take_flag", msg, socket) do
    case Chat.OverViewState.take_flag(msg) do
      {:reply, {:fail}, _} -> {:reply, :fail, socket}
      {:reply, {:ok}, _} -> {:reply, :ok, socket}
    end
  end

  def handle_in("update_player", msg, socket) do
    broadcast! socket, "update_player", msg
    {:reply, :ok, assign(socket, :player_data, msg)}
  end
end
