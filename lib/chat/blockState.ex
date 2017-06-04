defmodule Chat.BlockState do
    use GenServer
    def insert(player), do: GenServer.cast(:world_state, {:insert, player})

    def start_link() do
        GenServer.start_link(__MODULE__, [], name: :world_state)
    end

    def val() do
        GenServer.call(:world_state, :val)
    end

    def init() do
        {:ok, []}
    end

    def handle_cast({:insert, player}, val) do
        {:noreply, [player | val]}
    end

    def handle_call(:val, _from, val) do
        {:reply, val, val}
    end
end