"""
background_utils.py - Background processing utilities for eBay listing tools

This module provides tools for running operations in the background including:
- Thread management for long-running tasks
- Progress reporting
- Cancellation support
- Safe UI updates from background threads
"""

import threading
import queue
import time
import logging
import traceback
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import tkinter as tk

# Configure logging
logger = logging.getLogger(__name__)

class BackgroundTask:
    """
    Class for managing background tasks with progress reporting.
    
    This utility makes it easy to run time-consuming operations in a background
    thread while keeping the UI responsive and providing progress updates.
    """
    
    def __init__(self, 
                name: str,
                target_function: Callable,
                args: Tuple = (),
                kwargs: Dict[str, Any] = None,
                on_progress: Optional[Callable[[int, int, str], None]] = None,
                on_complete: Optional[Callable[[Any], None]] = None,
                on_error: Optional[Callable[[Exception], None]] = None):
        """
        Initialize a background task.
        
        Args:
            name: Task name for identification and logging
            target_function: Function to run in the background
            args: Positional arguments for the target function
            kwargs: Keyword arguments for the target function
            on_progress: Optional callback for progress updates
                         Receives (current_value, total_value, message)
            on_complete: Optional callback for task completion
                         Receives the return value of the target function
            on_error: Optional callback for error handling
                      Receives the exception that was raised
        """
        self.name = name
        self.target_function = target_function
        self.args = args
        self.kwargs = kwargs or {}
        self.on_progress = on_progress
        self.on_complete = on_complete
        self.on_error = on_error
        
        # Status tracking
        self.is_running = False
        self.is_cancelled = False
        self.progress_current = 0
        self.progress_total = 0
        self.progress_message = ""
        self.result = None
        self.error = None
        
        # Thread and communication queue
        self.thread = None
        self.queue = queue.Queue()
    
    def start(self):
        """Start the background task."""
        if self.is_running:
            logger.warning(f"Task '{self.name}' is already running")
            return
        
        # Reset status
        self.is_running = True
        self.is_cancelled = False
        self.progress_current = 0
        self.progress_total = 0
        self.progress_message = "Starting..."
        self.result = None
        self.error = None
        
        # Create and start the thread
        self.thread = threading.Thread(
            target=self._run_task,
            name=f"BackgroundTask-{self.name}"
        )
        self.thread.daemon = True
        self.thread.start()
        
        logger.info(f"Started background task '{self.name}'")
    
    def _run_task(self):
        """Run the target function in the background thread."""
        try:
            # Add a progress tracking function to the kwargs
            self.kwargs['report_progress'] = self.report_progress
            
            # Add a cancellation check function to the kwargs
            self.kwargs['check_cancelled'] = self.check_cancelled
            
            # Run the function
            self.result = self.target_function(*self.args, **self.kwargs)
            
            # Handle completion if not cancelled
            if not self.is_cancelled:
                # Put completion message in the queue
                self.queue.put(('complete', self.result))
        except Exception as e:
            # Log the error
            logger.error(f"Error in background task '{self.name}': {str(e)}")
            logger.debug(traceback.format_exc())
            
            # Store the error
            self.error = e
            
            # Put error message in the queue
            self.queue.put(('error', e))
        finally:
            # Mark as not running
            self.is_running = False
    
    def report_progress(self, current: int, total: int, message: str = ""):
        """
        Report progress from the background thread.
        
        This function should be called by the target function to report progress.
        
        Args:
            current: Current progress value
            total: Total progress value (for percentage calculation)
            message: Optional progress message
        """
        # Update status
        self.progress_current = current
        self.progress_total = total
        self.progress_message = message
        
        # Put progress message in the queue
        self.queue.put(('progress', (current, total, message)))
    
    def check_cancelled(self) -> bool:
        """
        Check if the task has been cancelled.
        
        The target function should call this periodically to check if it should stop.
        
        Returns:
            True if the task has been cancelled, False otherwise
        """
        return self.is_cancelled
    
    def cancel(self):
        """
        Request cancellation of the task.
        
        This doesn't force the task to stop. The target function must cooperate
        by checking the cancellation status using check_cancelled().
        """
        if not self.is_running:
            return
        
        # Set the cancelled flag
        self.is_cancelled = True
        logger.info(f"Cancellation requested for task '{self.name}'")
    
    def process_messages(self):
        """
        Process messages from the background thread.
        
        This function should be called periodically from the main thread,
        typically using a Tkinter after() call.
        
        Returns:
            True if the task is still running, False otherwise
        """
        # Process all available messages
        try:
            while True:
                # Get a message without blocking
                message_type, data = self.queue.get_nowait()
                
                # Handle the message
                if message_type == 'progress':
                    current, total, message = data
                    if self.on_progress:
                        self.on_progress(current, total, message)
                
                elif message_type == 'complete':
                    if self.on_complete:
                        self.on_complete(data)
                
                elif message_type == 'error':
                    if self.on_error:
                        self.on_error(data)
                
                # Mark the message as processed
                self.queue.task_done()
        
        except queue.Empty:
            # No more messages
            pass
        
        # Return True if the task is still running
        return self.is_running
    
    def wait(self, timeout: Optional[float] = None) -> bool:
        """
        Wait for the task to complete.
        
        This function blocks until the task completes or the timeout expires.
        
        Args:
            timeout: Optional timeout in seconds
            
        Returns:
            True if the task completed, False if the timeout expired
        """
        if not self.is_running or not self.thread:
            return True
        
        # Join the thread with timeout
        self.thread.join(timeout)
        
        # Return True if the thread is no longer alive
        return not self.thread.is_alive()


class BackgroundTaskManager:
    """
    Manager for multiple background tasks.
    
    This utility makes it easy to manage multiple background tasks
    from a Tkinter application, handling UI updates safely.
    """
    
    def __init__(self, root: tk.Tk, poll_interval: int = 100):
        """
        Initialize the task manager.
        
        Args:
            root: Tkinter root widget
            poll_interval: Polling interval in milliseconds
        """
        self.root = root
        self.poll_interval = poll_interval
        self.tasks = {}
        self.polling_active = False
    
    def start_task(self, task: BackgroundTask) -> str:
        """
        Start a background task.
        
        Args:
            task: Background task to start
            
        Returns:
            Task ID
        """
        # Generate a unique ID for the task
        task_id = f"{task.name}-{id(task)}"
        
        # Store the task
        self.tasks[task_id] = task
        
        # Start the task
        task.start()
        
        # Start polling if needed
        self._ensure_polling()
        
        return task_id
    
    def create_and_start_task(self, 
                            name: str,
                            target_function: Callable,
                            args: Tuple = (),
                            kwargs: Dict[str, Any] = None,
                            on_progress: Optional[Callable[[int, int, str], None]] = None,
                            on_complete: Optional[Callable[[Any], None]] = None,
                            on_error: Optional[Callable[[Exception], None]] = None) -> str:
        """
        Create and start a background task.
        
        Args:
            name: Task name for identification and logging
            target_function: Function to run in the background
            args: Positional arguments for the target function
            kwargs: Keyword arguments for the target function
            on_progress: Optional callback for progress updates
            on_complete: Optional callback for task completion
            on_error: Optional callback for error handling
            
        Returns:
            Task ID
        """
        # Create the task
        task = BackgroundTask(
            name=name,
            target_function=target_function,
            args=args,
            kwargs=kwargs,
            on_progress=on_progress,
            on_complete=on_complete,
            on_error=on_error
        )
        
        # Start and return the ID
        return self.start_task(task)
    
    def cancel_task(self, task_id: str) -> bool:
        """
        Cancel a background task.
        
        Args:
            task_id: ID of the task to cancel
            
        Returns:
            True if the task was found and cancelled, False otherwise
        """
        if task_id not in self.tasks:
            logger.warning(f"Task '{task_id}' not found")
            return False
        
        # Get the task
        task = self.tasks[task_id]
        
        # Cancel the task
        task.cancel()
        
        return True
    
    def cancel_all_tasks(self):
        """Cancel all running tasks."""
        for task_id, task in list(self.tasks.items()):
            if task.is_running:
                task.cancel()
    
    def get_task(self, task_id: str) -> Optional[BackgroundTask]:
        """
        Get a task by ID.
        
        Args:
            task_id: ID of the task
            
        Returns:
            Task object, or None if not found
        """
        return self.tasks.get(task_id)
    
    def _poll_tasks(self):
        """Poll all tasks for messages and remove completed tasks."""
        # Process messages for all tasks
        active_tasks = False
        
        for task_id, task in list(self.tasks.items()):
            # Process messages
            still_running = task.process_messages()
            
            # Remove completed tasks that are no longer running
            if not still_running:
                # Keep task in the dictionary for a while to allow accessing results
                active_tasks = active_tasks or still_running
        
        # Schedule next poll if there are active tasks
        if active_tasks or self.tasks:
            self.root.after(self.poll_interval, self._poll_tasks)
        else:
            self.polling_active = False
    
    def _ensure_polling(self):
        """Ensure polling is active."""
        if not self.polling_active:
            self.polling_active = True
            self.root.after(self.poll_interval, self._poll_tasks)
    
    def cleanup(self):
        """Clean up completed tasks."""
        # Remove tasks that are no longer running
        for task_id in list(self.tasks.keys()):
            task = self.tasks[task_id]
            if not task.is_running:
                del self.tasks[task_id]


def run_with_progress(root: tk.Tk, 
                    title: str, 
                    function: Callable, 
                    args: Tuple = (),
                    kwargs: Dict[str, Any] = None,
                    on_complete: Optional[Callable[[Any], None]] = None,
                    cancellable: bool = True) -> Any:
    """
    Run a function in a background thread with a progress dialog.
    
    Args:
        root: Tkinter root widget
        title: Dialog title
        function: Function to run
        args: Positional arguments for the function
        kwargs: Keyword arguments for the function
        on_complete: Optional callback for task completion
        cancellable: Whether the operation can be cancelled
        
    Returns:
        Dialog instance (for handling manually if needed)
    """
    # Create the progress dialog
    dialog = ProgressDialog(root, title, cancellable=cancellable)
    
    # Prepare kwargs
    kwargs = kwargs or {}
    
    # Define the callbacks
    def on_progress(current, total, message):
        dialog.update_progress(current, total, message)
    
    def on_task_complete(result):
        dialog.complete()
        if on_complete:
            on_complete(result)
    
    def on_error(error):
        dialog.show_error(str(error))
    
    # Create the task
    task = BackgroundTask(
        name=title,
        target_function=function,
        args=args,
        kwargs=kwargs,
        on_progress=on_progress,
        on_complete=on_task_complete,
        on_error=on_error
    )
    
    # Set the task on the dialog for cancellation
    dialog.set_task(task)
    
    # Start the task
    task.start()
    
    # Start the dialog (this will block until the dialog is closed)
    dialog.show()
    
    return dialog


class ProgressDialog:
    """
    Dialog for displaying progress of a background operation.
    
    This creates a modal dialog with a progress bar and status message.
    """
    
    def __init__(self, parent: tk.Widget, title: str, cancellable: bool = True):
        """
        Initialize the progress dialog.
        
        Args:
            parent: Parent widget
            title: Dialog title
            cancellable: Whether the operation can be cancelled
        """
        self.parent = parent
        self.title = title
        self.cancellable = cancellable
        
        # Create dialog window
        self.dialog = tk.Toplevel(parent)
        self.dialog.title(title)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        self.dialog.protocol("WM_DELETE_WINDOW", self.on_close)
        
        # Set fixed size
        self.dialog.resizable(False, False)
        
        # Center on parent
        self._center_on_parent()
        
        # Create dialog contents
        self._create_widgets()
        
        # Associated task
        self.task = None
        
        # Poll for messages
        self._start_polling()
    
    def _center_on_parent(self):
        """Center the dialog on the parent window."""
        # Wait for dialog to be ready
        self.dialog.update_idletasks()
        
        # Calculate position
        parent_x = self.parent.winfo_rootx()
        parent_y = self.parent.winfo_rooty()
        parent_width = self.parent.winfo_width()
        parent_height = self.parent.winfo_height()
        
        dialog_width = 400
        dialog_height = 150
        
        x = parent_x + (parent_width - dialog_width) // 2
        y = parent_y + (parent_height - dialog_height) // 2
        
        # Set dialog size and position
        self.dialog.geometry(f"{dialog_width}x{dialog_height}+{x}+{y}")
    
    def _create_widgets(self):
        """Create dialog widgets."""
        # Main frame with padding
        frame = tk.Frame(self.dialog, padx=20, pady=20)
        frame.pack(fill=tk.BOTH, expand=True)
        
        # Status message
        self.status_var = tk.StringVar(value="Starting...")
        self.status_label = tk.Label(frame, textvariable=self.status_var, anchor=tk.W)
        self.status_label.pack(fill=tk.X, pady=(0, 10))
        
        # Progress bar
        self.progress_var = tk.DoubleVar(value=0)
        self.progress_bar = ttk.Progressbar(
            frame, 
            variable=self.progress_var,
            maximum=100,
            mode='determinate'
        )
        self.progress_bar.pack(fill=tk.X, pady=(0, 10))
        
        # Progress text
        self.progress_text_var = tk.StringVar(value="0%")
        self.progress_text_label = tk.Label(frame, textvariable=self.progress_text_var)
        self.progress_text_label.pack(fill=tk.X, pady=(0, 10))
        
        # Cancel button (if cancellable)
        if self.cancellable:
            self.cancel_button = ttk.Button(frame, text="Cancel", command=self.on_cancel)
            self.cancel_button.pack(side=tk.RIGHT, padx=5)
    
    def set_task(self, task: BackgroundTask):
        """
        Set the associated task.
        
        Args:
            task: Background task to associate with this dialog
        """
        self.task = task
    
    def update_progress(self, current: int, total: int, message: str = ""):
        """
        Update the progress display.
        
        Args:
            current: Current progress value
            total: Total progress value
            message: Status message
        """
        # Update status message if provided
        if message:
            self.status_var.set(message)
        
        # Calculate percentage
        if total > 0:
            percentage = (current / total) * 100
        else:
            percentage = 0
        
        # Update progress bar
        self.progress_var.set(percentage)
        
        # Update progress text
        self.progress_text_var.set(f"{percentage:.1f}% ({current}/{total})")
        
        # Force update
        self.dialog.update_idletasks()
    
    def complete(self):
        """Mark the operation as complete."""
        # Update progress to 100%
        self.progress_var.set(100)
        self.progress_text_var.set("100% (Complete)")
        self.status_var.set("Operation completed successfully")
        
        # Change cancel button to close
        if self.cancellable:
            self.cancel_button.config(text="Close", command=self.dialog.destroy)
        else:
            # Add a close button
            ttk.Button(self.dialog, text="Close", command=self.dialog.destroy).pack(
                side=tk.RIGHT, padx=5, pady=5)
    
    def show_error(self, error_message: str):
        """
        Show an error message.
        
        Args:
            error_message: Error message to display
        """
        # Update status
        self.status_var.set(f"Error: {error_message}")
        
        # Change cancel button to close
        if self.cancellable:
            self.cancel_button.config(text="Close", command=self.dialog.destroy)
        else:
            # Add a close button
            ttk.Button(self.dialog, text="Close", command=self.dialog.destroy).pack(
                side=tk.RIGHT, padx=5, pady=5)
    
    def on_cancel(self):
        """Handle cancel button click."""
        if self.task:
            # Request cancellation
            self.task.cancel()
            
            # Update status
            self.status_var.set("Cancelling...")
            
            # Disable cancel button until operation is actually cancelled
            self.cancel_button.config(state=tk.DISABLED)
    
    def on_close(self):
        """Handle window close."""
        # Same as cancel
        if self.cancellable:
            self.on_cancel()
        
        # Don't actually close the window - wait for the operation to complete or be cancelled
    
    def show(self):
        """Show the dialog and start the operation."""
        # This will make the dialog modal
        self.dialog.focus_set()
        self.dialog.wait_visibility()
        self.dialog.grab_set()
    
    def _poll_task(self):
        """Poll the task for messages."""
        if self.task:
            # Process messages from the task
            still_running = self.task.process_messages()
            
            # Schedule next poll if still running
            if still_running:
                self.dialog.after(100, self._poll_task)
    
    def _start_polling(self):
        """Start polling for messages."""
        self.dialog.after(100, self._poll_task)