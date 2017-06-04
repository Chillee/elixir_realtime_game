defmodule Chat.OverViewState do
    use GenServer

    def start_link() do
        GenServer.start_link(__MODULE__, %{flag_holder: [nil, nil], score: []}, name: :overview_state)
    end

    def take_flag(msg) do
        GenServer.call(:overview_state, {:take_flag, msg})
    end

    def score_flag(data) do
        GenServer.cast(:overview_state, {:return_flag, data})
    end

    def val() do
        GenServer.call(:overview_state, :val)
    end

    def init() do
        {:ok, %{flag_holder: [nil, nil], score: []}}
    end

    def handle_call({:take_flag, %{"id" => id, "team" => team}}, _from, %{flag_holder: flags, score: _score}) do
        team_num = Enum.at flags, team
        case team_num do
            nil -> {:reply, :ok, %{flag_holder: List.replace_at(flags, team, id), score: _score}}
            x -> {:reply, :fail, %{flag_holder: flags, score: _score}}
        end
    end

    def handle_call(:val, _from, val) do
        {:reply, val, val}
    end
end