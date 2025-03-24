import concurrent.futures

class ConcurrentRunner:
    def __init__(self):
        self.future = None
        self.executor = None
        self.termination = None
        self.reference = None       # whatever reference you want to pass till the end. Could be the self, could be a wrapped object
        self.result = None

    def start_running(self, func, termination, *args, **kwargs):
        if self.future is None or self.future.done():
            self.executor = concurrent.futures.ThreadPoolExecutor()
            self.result = None
            self.index = 0
            self.termination = termination  # Remember the termination function
            self.future = self.executor.submit(func, *args, **kwargs)
            self.future.add_done_callback(self.done_callback)


    def done_callback(self, future):
        if not future.cancelled():
            self.result = future.result()  # Get the result of the input function
            if self.termination:
                self.termination(self.reference, self.result)  # Call the termination function
        self.executor.shutdown(wait=False)  # Shutdown the executor


    def stop_running(self):
        if self.future is not None and not self.future.done():
            self.future.cancel()  # Cancel the future if it's still running
            if self.termination:
                self.termination(self.reference)  # Call the termination function
                self.termination = None
            self.executor.shutdown(wait=False)  # Shutdown the executor
