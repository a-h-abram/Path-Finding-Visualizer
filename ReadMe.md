# Path Finding Visualizer

## Soft Description
Web app which shows how different path finding algorithms work thanks to a homemade graphical interface.  
I added some extra stuff like an "Uber Pool system", a dynamic recalculation of the path, some maze algorithm 
generation, and some cool CSS animations.

## Algorithm used

**Path Finding Algorithms :**
- A* (A Star)
- Dijkstra

**Maze Generation Algorithms :**
- Recursive Backtracker 

> All the calculations are made with a graph & nodes structure which can be directional or bidirectional, 
weighted or not.

## Technical Description
- **Languages**: Node.js, jQuery
- **Framework**: Express
- **Graphical Interface**: Homemade with HTML (grid is composed of div instead of canvas) / CSS 

## Features
- **Uber Pool system**: You can put some "Uber points" to tell the algorithm to pass these points before joining the 
final node.
- **Dynamic UI**: Once the algorithms found a path, you can add a wall on the path and it'll immediatly calculate a new 
path in real-time
- **Drag'N'Drop**: Once the algorithms found a path, you can drag'n'drop the end node and you'll see in real-time the new 
path for it.

> **Developer: Anas Habib ABRAM**
