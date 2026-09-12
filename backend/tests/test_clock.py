from app.core.clock import SimClock


def test_clock_advances():
    c = SimClock()
    assert c.tick == 0
    assert c.advance() == 1
    assert c.tick == 1
