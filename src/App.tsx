import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { formatTime } from './utils';

type Interval = {
  start: Date;
  end: Date;
  working: boolean;
}

const initialState = {
  intervals: [] as Array<Interval>,
  lastIntervalStart: new Date(),
  working: false,
  isRunning: true,
  timeElapsed: 0,
  stopwatchTimer: null as ReturnType<typeof setInterval> | null,
  notificationTimer: null as ReturnType<typeof setInterval> | null,
  lastOffScreenNotification: null as Date | null,
  lastSleepNotification: null as Date | null
}

const ButtonsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  grid-area: buttons;
`;

const Button = styled.button`
  border-radius: 50%;
  padding: 40px;
  margin: 20px;
  font-size: 20px;
  height: 200px;
  width: 200px;
  background-color: transparent;
  border: 2px solid #3333ff;
`;

type SwitchButtonProps = {
  working: boolean;
  onClick: () => void;
}

const SwitchButton = ({ working, onClick }: SwitchButtonProps) => (
  <Button onClick={onClick}>
    {
      working ? 'Pause' : 'Back 2 work'
    }
  </Button>
);

type SaveButtonProps = {
  onClick: () => void;
}

const SaveButton = ({ onClick }: SaveButtonProps) => (
  <Button onClick={onClick}>
    Save
  </Button>
)

const StopwatchWrapper = styled.div`
  grid-area: stopwatch;
  font-size: 50px;
  margin: auto;
  text-align: center;
  small {
    font-size: 20px;
    color: #aa4466;
  }
`;

type StopwatchProps = {
  time: number;
  workedTime: number;
}

const Stopwatch = ({time, workedTime}: StopwatchProps) => (
  <StopwatchWrapper>
    {
      formatTime(time)
    }
    <br/>
    <small>
      {
        `Time worked ${formatTime(workedTime)}`
      }
    </small>
  </StopwatchWrapper>
)

const IntervalWrapper = styled.div`
  grid-area: intervals;
  display: flex;
  border-radius: 10px;

`;

const IntervalSpan = styled.span<Interval>`
  ${({start, end, working}) => css`
    flex-grow: ${end.getTime() - start.getTime()};
    background-color: ${working ? css`#bb4466` : css`#4444ff`};
  `}
`;

const secretMessage = 'RG9waSVDNCU4RGUlMjBwb2plYmFuZWolMjB0eSUyMGJlanNtZW50JTIwZHZlbGVyc2slQzMlQkQlMjBrb2tvdCUyQyUyMGRhaiUyMG5hJTIwZHZhZHNhJUM1JUE1JTIwc2t1cnZlbiVDMyVCRGNoJTIwc2VrJUMzJUJBbmQlMjBrc2ljaHQlMjBvZCUyMG1vbml0b3J1JTIwbmVjaCUyMG5lc2thcGUlQzUlQTE=';


const OFF_SCREEN_MESSAGE = new SpeechSynthesisUtterance(decodeURIComponent(atob(secretMessage)));
OFF_SCREEN_MESSAGE.lang = 'sk-SK'

const getWorkedIntervals = (state: typeof initialState) => state.intervals.length > 0 ? [ ...state.intervals, { 
  start: state.intervals[state.intervals.length - 1].end,
  end: new Date(),
  working: state.working
}].filter(({working}) => working === true) : []

const calculateWorkedTimeFromLastNotification = (state: typeof initialState) => 
  (state.intervals.length > 0) ? getWorkedIntervals(state).map(({start, end}) => (
    (end < (state.lastOffScreenNotification ?? 0)) ? 0 :
      end.getTime() - Math.max(start.getTime(), state.lastOffScreenNotification?.getTime() ?? 0)
  )).reduce((a,b) => a + b, 0) : (
    state.working ? state.timeElapsed : 0
  );

const calculateWorkedTime = (state: typeof initialState) => getWorkedIntervals(state).map(({start, end}) => end.getTime() - start.getTime()).reduce((a, b) => a + b, 0);

const shouldRunOffScreenNotification = (state: typeof initialState) => {
  if (!state.working) {
    return false;
  }
  const workingTimePassed = calculateWorkedTimeFromLastNotification(state);
  return workingTimePassed >= 1200000;
}

const AppWrapper = styled.div`
  width: 80%;
  display: grid;
  grid-template:
    "stopwatch buttons" 300px
    "intervals intervals" 50px
    / auto 200px;
  font-family: "Courier New", Courier, monospace;
  position: fixed;
  margin-top: calc((100vh - 350px) / 2);
`;

const App = () => {
  const [state, setState] = useState(initialState);
  const workedTime = calculateWorkedTime(state);
  const updateTimer = () => {
    const currentTime = Date.now();
    setState((prevState) => ({
      ...prevState,
      timeElapsed: currentTime - prevState.lastIntervalStart.getTime()
    }));
  }
  const onPhaseChange = () => 
    setState((prevState) => {
      const currentTime = new Date();
      return {
        ...prevState,
        intervals: prevState.intervals.concat({
          start: prevState.lastIntervalStart,
          end: currentTime,
          working: prevState.working
        }),
        lastIntervalStart: currentTime,
        working: !prevState.working
      };
    })
  const onSave = () => {
    setState((prevState) => {
      if (prevState.stopwatchTimer) {
        clearInterval(prevState.stopwatchTimer);
      }
      if (prevState.notificationTimer) {
        clearInterval(prevState.notificationTimer);
      }
      return {
        ...prevState,
        isRunning: false,
        stopwatchTimer: null
      }}
    );
  };
  useEffect(() => {
    state.stopwatchTimer = setInterval(updateTimer, 10);
    state.notificationTimer = setInterval(runNotifications, 20000)
  }, []);
  const runNotifications = () => setState((prevState) => {
    if (shouldRunOffScreenNotification(prevState)) {
      window.speechSynthesis.speak(OFF_SCREEN_MESSAGE);
      return {
        ...prevState,
        lastOffScreenNotification: new Date()
      }
    }
    return prevState;
  })
  return (
    <AppWrapper>
      {
        state.isRunning && (
          <ButtonsWrapper>
            <SwitchButton
              working={state.working}
              onClick={onPhaseChange}
            />
            <SaveButton onClick={onSave}/>
          </ButtonsWrapper>
        )
      }
      <Stopwatch time={state.timeElapsed} workedTime={workedTime}/>
      <IntervalWrapper>
        {
          state.intervals.map((interval, index) => (
            <IntervalSpan key={index} {...interval}/>
          ))
        }
      </IntervalWrapper>
    </AppWrapper>
  );
}

export default App;
