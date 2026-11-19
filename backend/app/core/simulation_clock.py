from datetime import datetime, timezone, timedelta
import threading

class SimulationClock:
    _instance = None
    # RLock (not Lock): the public mutators below call self.now() to flush elapsed
    # wall-clock time while still holding the lock. With a plain Lock this is a
    # self-deadlock that freezes the calling thread (and the asyncio event loop,
    # since FastAPI handlers invoke these from the loop thread).
    _lock = threading.RLock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(SimulationClock, cls).__new__(cls)
                cls._instance._init_clock()
            return cls._instance

    def _init_clock(self):
        # Base simulation epoch: Nov 14, 2026, 09:00:00 UTC
        self._base_sim_time = datetime(2026, 11, 14, 9, 0, 0, tzinfo=timezone.utc)
        self._current_sim_time = self._base_sim_time
        self._speed_multiplier = 1
        self._is_paused = False
        self._last_tick_wall_clock = datetime.now(timezone.utc)

    def now(self) -> datetime:
        with self._lock:
            if not self._is_paused:
                now_wall = datetime.now(timezone.utc)
                elapsed_wall = (now_wall - self._last_tick_wall_clock).total_seconds()
                self._current_sim_time += timedelta(seconds=elapsed_wall * self._speed_multiplier)
                self._last_tick_wall_clock = now_wall
            return self._current_sim_time

    def set_speed(self, multiplier: int):
        with self._lock:
            self.now()  # flush elapsed wall clock
            self._speed_multiplier = max(1, multiplier)

    def pause(self):
        with self._lock:
            self.now()  # flush elapsed
            self._is_paused = True

    def resume(self):
        with self._lock:
            self._last_tick_wall_clock = datetime.now(timezone.utc)
            self._is_paused = False

    def reset(self, start_time: datetime = None):
        with self._lock:
            self._base_sim_time = start_time or datetime(2026, 11, 14, 9, 0, 0, tzinfo=timezone.utc)
            self._current_sim_time = self._base_sim_time
            self._last_tick_wall_clock = datetime.now(timezone.utc)
            self._is_paused = False

    def advance_to(self, target_time: datetime) -> datetime:
        """Move the simulation timeline forward without ever moving it backward."""
        if target_time.tzinfo is None:
            target_time = target_time.replace(tzinfo=timezone.utc)
        target_time = target_time.astimezone(timezone.utc)
        with self._lock:
            current = self.now()
            if target_time > current:
                self._current_sim_time = target_time
                self._last_tick_wall_clock = datetime.now(timezone.utc)
            return self._current_sim_time

    def is_paused(self) -> bool:
        with self._lock:
            return self._is_paused

    def speed(self) -> int:
        with self._lock:
            return self._speed_multiplier

clock = SimulationClock()
