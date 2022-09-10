import {
  MaxTimeUnit,
  useStopwatchReplicantControl,
  useStopwatchReplicantReader,
} from "hooks/use-stopwatch-replicant";
import { ChangeEvent, ReactElement, useState } from "react";

// enum Keyboardkey {
//   Enter = "Enter",
//   Escape = "Escape",
//   Tab = "Tab",
//   ArrowRight = "ArrowRight",
//   ArrowLeft = "ArrowLeft",
//   ArrowUp = "ArrowUp",
//   ArrowDown = "ArrowDown",
// }

export function StopwatchPanel(): ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);
  // const { start, stop, reset, addOffset, setBackwards, setOffset } = useStopwatchReplicantControl();
  const { start, stop, reset, addOffset } = useStopwatchReplicantControl();
  const {
    minutes,
    seconds,
    isEnded,
    isRunning,
    periodTime: periodTimeSw,
    limit,
  } = useStopwatchReplicantReader({
    maxTimeUnit: MaxTimeUnit.MINUTES,
  });
  const [enableReset, setEnableReset] = useState(false);

  const [minutesInput, setMinutesInput] = useState("");
  const [secondsInput, setSecondsInput] = useState("");
  const [offsetSecondsInput, setOffsetSecondsInput] = useState("10");
  const [isModifying, setIsModifying] = useState(false);
  const [canEditTime, setCanEditTime] = useState(false);
  const [periodTime, setPeriodTime] = useState<number>(periodTimeSw ?? 0);
  const [periodsNumber, setPeriodsNumber] = useState<number>(
    limit > 0 && periodTime > 0 ? Math.floor(limit / periodTime) : 0
  );

  const handleFocus = () => {
    if (!isRunning && canEditTime) {
      setMinutesInput((minutes ?? 0).toString().padStart(2, "0"));
      setSecondsInput((seconds ?? 0).toString().padStart(2, "0"));
      setIsModifying(true);
    }
  };

  const handleBlur = (
    input: string,
    currentTimeToChange: number | undefined,
    unit: number
  ) => {
    return () => {
      if (isModifying && canEditTime) {
        try {
          const numericInput = parseInt(input, 10);
          const calculatedTime =
            (numericInput - (currentTimeToChange ?? 0)) * unit;
          addOffset(calculatedTime);
        } catch (error) {}
      }
      setIsModifying(false);
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOnChange = (setInput: (...args: any[]) => any) => {
    return (event: ChangeEvent<HTMLInputElement>) => {
      if (isRunning && canEditTime) {
        return;
      }
      setInput(event.target.value);
    };
  };

  const isReadOnlyTime = () => isRunning && !canEditTime;

  const handleStart = (event) => {
    event.preventDefault();
    if (!isRunning) {
      const number = periodsNumber > 0 ? periodsNumber : 0; // Avoid negative values
      const safeperiodTime = periodTime > 0 ? periodTime : 0; // Avoid negative values
      const swLimit = safeperiodTime * number;

      setMinutesInput("0");
      setSecondsInput("0");
      setCanEditTime(false);
      setEnableReset(false);
      start({
        limit: swLimit * 1000,
        periodTime: safeperiodTime * 1000,
      });
    }
    if (isRunning) {
      stop();
    }
  };

  return (
    <div>
      <div>
        <h3>Match time</h3>

        <div className="error">{error ? error : null}</div>
        <div>
          <fieldset disabled={isRunning}>
            <label htmlFor="match-period-time">Period time (seconds)</label>
            <input
              type="number"
              name="match-period-time"
              id="match-period-time"
              min={1}
              value={periodTime}
              placeholder="Period duration in seconds"
              onChange={(event) => {
                try {
                  const numericInput = parseInt(event.target.value, 10);
                  setPeriodTime(numericInput);
                } catch (error) {}
              }}
              disabled={isRunning}
            />

            <label htmlFor="match-periods-number">Periods number</label>
            <input
              type="number"
              name="match-number-periods"
              id="match-number-periods"
              onChange={(event) => {
                try {
                  const numericInput = parseInt(event.target.value, 10);
                  setPeriodsNumber(numericInput);
                } catch (error) {}
              }}
              value={periodsNumber.toString()}
              placeholder="Number of periods"
              disabled={isRunning}
            />
          </fieldset>
          <fieldset>
            <input
              type="number"
              name="minutes"
              id="minutes"
              value={isModifying && canEditTime ? minutesInput : minutes}
              readOnly={isReadOnlyTime()}
              onFocus={handleFocus}
              onBlur={handleBlur(minutesInput, minutes, 60000)}
              onChange={handleOnChange(setMinutesInput)}
            />
            <span> : </span>
            <input
              type="number"
              name="seconds"
              id="seconds"
              value={isModifying && canEditTime ? secondsInput : seconds}
              readOnly={isReadOnlyTime()}
              onFocus={handleFocus}
              onBlur={handleBlur(secondsInput, seconds, 1000)}
              onChange={handleOnChange(setSecondsInput)}
            />
            <div>
              <fieldset>
                <label htmlFor="edit-time">
                  {canEditTime ? "Disable" : "Enable"} editing the time when
                  stop
                </label>
                <input
                  type="checkbox"
                  name="edit-time"
                  id="edit-time"
                  value={canEditTime.toString()}
                  onChange={(event) => {
                    setCanEditTime(event.target.checked);
                  }}
                />
              </fieldset>
            </div>
            <p>
              <small>
                Stop and click over the time to edit after enable the edit of
                the time.
              </small>
            </p>
            <p>
              To set time you must stop the stopwatch first and edit directly
              the time
            </p>
            {isEnded ? <p>The stopwatch has ended</p> : null}
          </fieldset>
        </div>
        <fieldset>
          <button onClick={handleStart} disabled={isModifying}>
            {isRunning ? "Stop" : "Start"}
          </button>
        </fieldset>
        <fieldset>
          <button
            onClick={() => {
              if (isRunning) {
                alert("You can not reset the stopwatch while running");
                return;
              }

              if (confirm("Sure you want to do this?")) {
                reset();
              }
            }}
            disabled={!enableReset}
          >
            Reset
          </button>

          <label htmlFor="enable-reset">
            {enableReset ? "Desactivar" : "Activar"} reset
          </label>
          <input
            type="checkbox"
            name="enable-reset"
            id="enable-reset"
            value={enableReset.toString()}
            onChange={(event) => {
              if (isRunning) {
                alert(
                  "You can not reset the stopwatch while running, stop it first"
                );
                event.preventDefault();
                event.target.checked = false;
                return;
              }
              setEnableReset((prev) => !prev);
            }}
          />
        </fieldset>
        <fieldset>
          <input
            type="number"
            name="offset"
            id="offset"
            placeholder="secs"
            min="0"
            value={offsetSecondsInput}
            onChange={(e) => setOffsetSecondsInput(e.target.value)}
          />
          <button
            onClick={(event) => {
              event.preventDefault();
              const offset = parseInt(offsetSecondsInput, 10);
              if (isNaN(offset)) {
                setError("Invalid offset");
                return;
              }
              setError(null);
              addOffset(offset);
            }}
          >
            Add
          </button>
          <small>
            To substract a quantity use `-` before. The time must be in seconds
          </small>
        </fieldset>
      </div>
    </div>
  );
}