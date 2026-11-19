"""Regression tests for the simulation clock.

Covers a real defect: SimulationClock used a non-reentrant threading.Lock while
pause()/set_speed() acquired it and then called self.now(), which re-acquires
the same lock. With a plain Lock that is a self-deadlock; because FastAPI
handlers run on the asyncio event loop thread, calling /api/v1/sim/control
with action=pause or set_speed would freeze the entire backend (the payment
rail simulator, WebSocket broadcasts, every request). The Pause button on the
live demo would hang the server rather than pause it.
"""

import threading
import time
from datetime import timedelta

from backend.app.core.simulation_clock import SimulationClock, clock


def test_clock_advances_with_simulation_time():
    """Clock must report a non-decreasing time and respond to speed changes."""
    before = clock.now()
    assert clock.speed() >= 1
    # A speed flip must not block for a long time.
    clock.set_speed(5)
    assert clock.speed() == 5
    after = clock.now()
    assert after >= before
    clock.set_speed(1)


def test_clock_pause_is_not_a_self_deadlock():
    """pause() must return promptly when called from a separate thread."""
    done = []
    t = threading.Thread(target=lambda: (clock.pause(), done.append(1)), daemon=True)
    t.start()
    t.join(timeout=4)
    assert done, "pause() deadlocked (non-reentrant lock while calling now())"
    assert clock.is_paused() is True
    clock.resume()
    assert clock.is_paused() is False


def test_clock_set_speed_is_not_a_self_deadlock():
    """set_speed() must return promptly when called from a separate thread."""
    done = []
    t = threading.Thread(target=lambda: (clock.set_speed(20), done.append(1)), daemon=True)
    t.start()
    t.join(timeout=4)
    assert done, "set_speed() deadlocked (non-reentrant lock while calling now())"
    assert clock.speed() == 20
    clock.set_speed(1)


def test_clock_pause_freezes_time():
    """While paused, simulation time must not advance."""
    clock.pause()
    t0 = clock.now()
    time.sleep(0.25)
    t1 = clock.now()
    clock.resume()
    time.sleep(0.25)
    t2 = clock.now()
    assert t1 == t0, "paused clock advanced"
    assert t2 > t1, "clock did not resume after resume()"


def test_clock_speed_multiplier_accelerates_time():
    """5x speed must advance simulation time faster than wall clock."""
    clock.set_speed(5)
    t0 = clock.now()
    time.sleep(0.3)
    t1 = clock.now()
    clock.set_speed(1)
    elapsed_sim = (t1 - t0).total_seconds()
    assert elapsed_sim >= 1.0, f"5x multiplier advanced only {elapsed_sim:.2f}s of sim time"


def test_clock_advance_to_is_forward_only():
    before = clock.now()
    target = before + timedelta(minutes=5)
    advanced = clock.advance_to(target)
    assert advanced >= target
    assert clock.advance_to(before) >= target
    clock.reset(start_time=before)
