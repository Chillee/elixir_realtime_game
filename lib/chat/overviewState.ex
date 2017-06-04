defmodule Chat.OverViewState do
    use GenServer

    def start_link() do
        GenServer.start_link(__MODULE__, %{flag_holder: [nil, nil], score: [0, 0], players: []}, name: :overview_state)
    end

    def take_flag(msg) do
        GenServer.call(:overview_state, {:take_flag, msg})
    end

    def score_flag(msg) do
        GenServer.call(:overview_state, {:score_flag, msg})
    end

    def remove_flag(msg) do
        GenServer.cast(:overview_state, {:remove_flag, msg})
    end

    def add_player(msg) do
        GenServer.cast(:overview_state, {:add_player, msg})
    end


    def val() do
        GenServer.call(:overview_state, :val)
    end

    # def handle_cast({:add_player})
    def handle_call({:take_flag, %{"id" => id, "team" => team}}, _from, data) do
        %{flag_holder: flags} = data
        team_num = Enum.at flags, team
        case team_num do
            nil -> {:reply, :ok, %{data | flag_holder: List.replace_at(flags, team, id)}}
            x -> {:reply, :fail, data}
        end
    end

    def handle_cast({:remove_flag, %{"id" => id}}, data) do
        %{flag_holder: flags} = data
        {:noreply, %{data | flag_holder: Enum.map(flags, fn(x) -> if x=id do nil else x end end)}}
    end

    def handle_call({:score_flag, %{"id" => id, "user_team" => user_team, "flag_team" => flag_team}}, _from, data) do
        %{flag_holder: flags, score: score} = data
        {:reply, :ok, %{data | flag_holder: List.replace_at(flags, flag_team, nil),
                        score: List.replace_at(score, user_team, (Enum.at score, user_team) + 1)}}
    end

    def handle_call(:val, _from, val) do
        {:reply, val, val}
    end
end