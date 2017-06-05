defmodule Chat.BlockState do
    use GenServer
    def insert(player), do: GenServer.cast(:world_state, {:insert, player})

    def start_link() do
        GenServer.start_link(__MODULE__, [], name: :world_state)
    end

    def val() do
        GenServer.call(:world_state, :val)
    end

    def remove_blocks(msg) do
        GenServer.cast(:world_state, {:remove_blocks, msg})
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

    def handle_cast({:remove_blocks, %{"block_ids" => block_ids}}, val) do
        {:noreply, Enum.map(val, (fn x -> if Enum.member?(block_ids, x["id"]) do if x["team"] === 1 do %{x | "team" => 0} else %{x | "team" => 1} end else x end end))}

    end
end