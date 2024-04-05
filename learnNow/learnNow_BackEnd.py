from pathlib import Path
from typing import NamedTuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from tqdm import tqdm
import json

import gymnasium as gym

from flask import Flask, request

app = Flask(__name__)

host = "127.0.0.1"
port = "8091"
debug = True

@app.route('/positions')
class Params(NamedTuple):
    total_episodes: int  
    learning_rate: float  
    gamma: float  
    epsilon: float  
    map_size: int  
    seed: int  
    is_slippery: bool  
    n_runs: int  
    action_size: int  
    state_size: int  
    proba_frozen: float  
    savefig_folder: Path  

@app.route('/positions')
def putInOrder(p):
    for y in range(len(p)):
        for x in range(len(p)):
            if x + 1 != len(p):
                if p[x][1][0] > p[x+1][1][0]:
                    temp = p[x+1]
                    p[x+1] = p[x]
                    p[x] = temp
                elif p[x][1][0] == p[x+1][1][0] and p[x][1][1] > p[x+1][1][1]:
                    temp = p[x+1]
                    p[x+1] = p[x]
                    p[x] = temp
    return p

@app.route('/positions')
def generate_map(rows, cols, pos):
    tempPos = putInOrder(pos)
    board = []
    counter = 0
    for x in range(rows):
        temp = []
        for y in range(cols):
            if x == tempPos[counter][1][0] and y == tempPos[counter][1][1]:
                if tempPos[counter][0] == "square":
                    temp.append("S")
                elif tempPos[counter][0] == "triangle":
                    temp.append("G")
                else:
                    temp.append("H")
                if (counter + 1 != len(pos)):
                    counter += 1
            else:
                temp.append("F")
        board.append(temp)
    return ["".join(x) for x in board]

@app.route('/positions')
class Qlearning:
    def __init__(self, learning_rate, gamma, state_size, action_size):
        self.state_size = state_size
        self.action_size = action_size
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.reset_qtable()

    def update(self, state, action, reward, new_state):
        delta = (
            reward
            + self.gamma * np.max(self.qtable[new_state, :])
            - self.qtable[state, action]
        )
        q_update = self.qtable[state, action] + self.learning_rate * delta
        return q_update

    def reset_qtable(self):
        self.qtable = np.zeros((self.state_size, self.action_size))


@app.route('/positions')
class EpsilonGreedy:
    def __init__(self, epsilon):
        self.epsilon = epsilon

    def choose_action(self, action_space, state, qtable):
        # First we randomize a number
        explor_exploit_tradeoff = rng.uniform(0, 1)

        # Exploration
        if explor_exploit_tradeoff < self.epsilon:
            action = action_space.sample()

        # Exploitation (taking the biggest Q-value for this state)
        else:
            if np.all(qtable[state, :]) == qtable[state, 0]:
                action = action_space.sample()
            else:
                action = np.argmax(qtable[state, :])
        return action

@app.route('/positions')
def run_env():
    global directionsArray
    directionsArray = []
    rewards = np.zeros((params.total_episodes, params.n_runs))
    steps = np.zeros((params.total_episodes, params.n_runs))
    episodes = np.arange(params.total_episodes)
    qtables = np.zeros((params.n_runs, params.state_size, params.action_size))
    all_states = []
    all_actions = []

    for run in range(params.n_runs):  # Run several times to account for stochasticity
        learner.reset_qtable()  # Reset the Q-table between runs

        temp = []
        for episode in tqdm(
            episodes, desc=f"Run {run}/{params.n_runs} - Episodes", leave=False
        ):
            state = env.reset(seed=params.seed)[0]  # Reset the environment
            step = 0
            done = False
            total_rewards = 0

            while not done:
                action = explorer.choose_action(
                    action_space=env.action_space, state=state, qtable=learner.qtable
                )

                # Log all states and actions
                all_states.append(state)
                all_actions.append(action)

                # Take the action (a) and observe the outcome state(s') and reward (r)
                new_state, reward, terminated, truncated, info = env.step(action)

                temp.append(action)
                done = terminated or truncated

                learner.qtable[state, action] = learner.update(
                    state, action, reward, new_state
                )

                total_rewards += reward
                step += 1

                # Our new state is state
                state = new_state

            # Log all rewards and steps
            rewards[episode, run] = total_rewards
            steps[episode, run] = step
            
            x = []
            a = {"Moves":str(temp)}
            b = {"Rewards":str(total_rewards)}
            x.append(a)
            x.append(b)
            
            directionsArray.append({"Action" + str(episode): x})
            temp = []
        qtables[run, :, :] = learner.qtable

    return rewards, steps, episodes, qtables, all_states, all_actions

@app.route('/positions')
def postprocess(episodes, params, rewards, steps, rows, cols):
    res = pd.DataFrame(
        data={
            "Episodes": np.tile(episodes, reps=params.n_runs),
            "Rewards": rewards.flatten(),
            "Steps": steps.flatten(),
        }
    )
    res["cum_rewards"] = rewards.cumsum(axis=0).flatten(order="F")
    res["map_size"] = np.repeat(f"{rows}x{cols}", res.shape[0])

    st = pd.DataFrame(data={"Episodes": episodes+1, "Steps": steps.mean(axis=1)})
    st["map_size"] = np.repeat(f"{rows}x{cols}", st.shape[0])
    return res, st

@app.route('/positions')
def qtable_directions_map(qtable, rows, cols):
    """Get the best learned action & map it to arrows."""
    qtable_val_max = qtable.max(axis=1).reshape(rows, cols)
    qtable_best_action = np.argmax(qtable, axis=1).reshape(rows, cols)
    directions = {0: "←", 1: "↓", 2: "→", 3: "↑"}
    qtable_directions = np.empty(qtable_best_action.flatten().shape, dtype=str)
    eps = np.finfo(float).eps  # Minimum float number on the machine
    for idx, val in enumerate(qtable_best_action.flatten()):
        if qtable_val_max.flatten()[idx] > eps:
            qtable_directions[idx] = directions[val]
    qtable_directions = qtable_directions.reshape(rows, cols)
    return qtable_val_max, qtable_directions

@app.route('/positions')
def startGame(r, c, pos, a):
    sns.set_theme()
    global rows
    global cols
    global positions
    global attemps
    global params
    global rng
    global env
    global learner
    global explorer
    global res_all
    global st_all
    rows, cols = r, c
    positions = grid2array(pos, r, c)
    attemps = a
    params = Params(
        total_episodes=a,
        learning_rate=0.3,
        gamma=0.95,
        epsilon=0.1,
        map_size=5,
        seed=123,
        is_slippery=False,
        n_runs=1,
        action_size=None,
        state_size=None,
        proba_frozen=0.9,
        savefig_folder=Path("../../_static/img/tutorials/"),
    )
    params

    rng = np.random.default_rng(params.seed)

    params.savefig_folder.mkdir(parents=True, exist_ok=True)
    env = gym.make(
        "FrozenLake-v1",
        is_slippery=False,
        render_mode="rgb_array",
        max_episode_steps=r*c*4,
        desc=generate_map(r, c, pos)
    )
    params = params._replace(action_size=env.action_space.n)
    params = params._replace(state_size=env.observation_space.n)
    learner = Qlearning(
        learning_rate=params.learning_rate,
        gamma=params.gamma,
        state_size=params.state_size,
        action_size=params.action_size,
    )
    explorer = EpsilonGreedy(
        epsilon=params.epsilon,
    )
    res_all = pd.DataFrame()
    st_all = pd.DataFrame()
    global rewards
    global steps
    global episodes
    global qtables
    global all_states
    global all_actions
    rewards, steps, episodes, qtables, all_states, all_actions = run_env()

    res, st = postprocess(episodes, params, rewards, steps, rows, cols)
    res_all = pd.concat([res_all, res])
    st_all = pd.concat([st_all, st])
    qtable = qtables.mean(axis=0)  # Average the Q-table between runs
    env.close()
    

def grid2array(pos, r, c):
    posArray = []
    for p in range(len(pos)):
        posArray.append(getArrayPos(r, c, pos[p][1]))
    return posArray

def getArrayPos(r, c, value):
    counter = 0
    for x in range(r):
        for y in range(c):
            if x == value[0] and y == value[1]:
                return counter
            counter += 1

@app.route('/positions', methods=['POST'])
def startServer():
    if request.method == 'POST':
        data = request.json
        startGame(data['rows'], data['columns'], data['positions'], data['attempts'])
        blt = []
        for x in range(len(directionsArray)):
            if type(directionsArray[x]) != dict and type(directionsArray[x] != list):
                blt.append(directionsArray[x])
        
        valueToReturn = {"result":directionsArray}
        return json.dumps(valueToReturn)

#Handle CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    return response

if __name__ == '__main__':
    app.run(host, port, debug)