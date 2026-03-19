# Value Iteration on Gridworld

This project is an interactive 5x5 Gridworld web application demonstrating the **Value Iteration algorithm**, a fundamental concept in Reinforcement Learning. It computes and dynamically visualizes the Expected State Value `V(s)` and the Optimal Policy `π(s)` directly in your browser.

## Features
- **Interactive Environment**: Click on grid cells to set the **Start State**, **Goal State**, and **Obstacles/Walls**.
- **Real-time Value Iteration**: Computes the optimal policy directly using JavaScript for instant results.
- **Dynamic Visualization**:
  - Highlights the optimal path from start to goal.
  - Displays optimal action arrows on each state pointing towards the path.
  - Generates a heat-map color scale indicating the highest return `V(s)` states.

## Live Demo
Check out the interactive demo online: [Value Iteration Gridworld](https://Joxanne.github.io/RL_PR2_ValuedIterationOnGridworld/)

## Local Usage
Since it is built with pure HTML, CSS, and JavaScript with no remote backend dependencies, you can simply clone this repository and open the file in your browser:

```bash
git clone https://github.com/Joxanne/RL_PR2_ValuedIterationOnGridworld.git
cd RL_PR2_ValuedIterationOnGridworld
```
Then double-click `index.html` to open it in Google Chrome, Edge, Safari, or Firefox.

## RL Formulation Used
- **State Space (S)**: 5x5 Grid positions `(row, col)`.
- **Action Space (A)**: Up, Down, Left, Right.
- **Transitions**: Deterministic logic. Actions taking the agent into a wall or out of bounds result in remaining in the same state.
- **Rewards (R)**: `-0.04` for each step, and `+1.0` upon successfully taking transitioning actions into the Goal state.
- **Discount Factor (γ)**: `0.99`.
