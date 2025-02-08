
class TaskScheduler {
    constructor(concurrency) {
        this.concurrency = concurrency;
        this.taskQueue = []; // Priority queue (sorted by priority)
        this.runningTasks = 0;
        this.taskMap = new Map(); // Store task details
        this.dependencyCount = new Map(); // Track pending dependencies
        this.dependents = new Map(); // Store dependents
    }

    // Add a new task
    addTask(id, fn, priority, dependencies = []) {
        this.taskMap.set(id, { id, fn, priority });
        this.dependencyCount.set(id, dependencies.length);

        if (!this.dependents.has(id)) this.dependents.set(id, []);
        dependencies.forEach(dep => {
            if (!this.dependents.has(dep)) this.dependents.set(dep, []);
            this.dependents.get(dep).push(id);
        });

        // If no dependencies, push directly to queue
        if (dependencies.length === 0) {
            this.enqueueTask(id);
        }
    }

    // Enqueue a task in priority order
    enqueueTask(id) {
        const task = this.taskMap.get(id);
        this.taskQueue.push(task);
        this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
        this.runNext();
    }

    // Run tasks concurrently based on available slots
    runNext() {
        while (this.runningTasks < this.concurrency && this.taskQueue.length > 0) {
            const task = this.taskQueue.shift();
            this.runningTasks++;

            task.fn().then(() => {
                this.runningTasks--;
                this.onTaskComplete(task.id);
                this.runNext();
            }).catch(err => {
                console.error(`Task ${task.id} failed:`, err);
                this.runningTasks--;
                this.runNext();
            });
        }
    }

    // Handle task completion
    onTaskComplete(id) {
        if (!this.dependents.has(id)) return;
        for (const dep of this.dependents.get(id)) {
            this.dependencyCount.set(dep, this.dependencyCount.get(dep) - 1);
            if (this.dependencyCount.get(dep) === 0) {
                this.enqueueTask(dep);
            }
        }
    }
}



 const tasks = [
    { id: "task1", processingTime: 2, dependencies: [],              priority: 1 },
    { id: "task2", processingTime: 1, dependencies: ["task1"],       priority: 2 },
    { id: "task3", processingTime: 3, dependencies: ["task1"],       priority: 1 },
    { id: "task4", processingTime: 1, dependencies: ["task2","task3"], priority: 3 },
    { id: "task5", processingTime: 2, dependencies: ["task4"],       priority: 2 },
    { id: "task6", processingTime: 2, dependencies: ["task5"],       priority: 1 },
    { id: "task7", processingTime: 1, dependencies: ["task5"],       priority: 3 },
    { id: "task8", processingTime: 2, dependencies: ["task5"],       priority: 2 }
  ];
  
  const scheduler = new TaskScheduler(2); // Allow 2 concurrent tasks
  for (let index = 0; index < tasks.length; index++) {
   
    scheduler.addTask(tasks[index].id, () => new Promise((res) => 
        {
            console.log(`${tasks[index].id} started.  (Priority: ${tasks[index].priority})`)
            setTimeout(() => { console.log(`${tasks[index].id} Done`); res(); }, tasks[index].processingTime)
        }
    ), tasks[index].priority, tasks[index].dependencies);

  }
