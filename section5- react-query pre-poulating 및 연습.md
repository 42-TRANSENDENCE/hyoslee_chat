# section5- react-query pre-poulating 및 연습

유저가 pre-populate한 데이터를 보게 하고싶다.
그래서 그 데이터를 캐시에 넣을 수도있고, 아니면 그냥 placeholder이기 때문에 캐시에 넣고 싶지 않을 수도 있다.
그 데이터는 서버 또는 클라이언트로부터 올 수 있고, 어디서 사용할 지는 어떤 React query메소드를 사용할지에 달려있다.
1. queryClient의 prefetchQuery메소드 : 서버로부터 받아온 data를 캐시에 추가한다.
2. queryClient의 setQueryData메소드 : 클라이언트로부터 받아온 data를 캐시에 추가한다.
useQuery를 실행하지 않는다.
(데이터를 캐쉬에 추가해서, 다음번 useQuery 요청에 그 캐쉬 데이터를 제공해 줄 수 있다.)
서버에서 데이터를 fetch하지 않고, 데이터에 기반한 UI 바꿀때 유용하다.
3. useQuery의 placeholder옵션 : 클라이언트로부터 받아온 data를 캐시에 추가하지 않는다.
4. useQuery의 initialDate옵션 : 클라이언트로부터 받아온 data를 캐시에 추가한다.

예시)

건강관리 스파 웹사이트의 85%가 홈페이지에서 treatments탭을 클릭한다고 하자.
queryClient.prefetchQuery로 treatments data를 캐시에 추가하자.
 유저가 treatments page를 로드할때,
 i) 캐시타임 이내라면, 캐쉬로부터 데이터를 로드해온다,
 그 후 컴포넌트를 마운팅해서 refresh를 trigger한 상황이므로 stale한 상태이다.
 따라서 useQuery가 fresh data를 fetch한다. 
ii) 캐시타임 이외라면, useQuery가 fresh data를 fetch해오고 그 동안에는 유저는 아무것도 볼 수 없다.

```jsx
export function Home(): ReactElement {
  usePrefetchTreatments();

  return (
    <Stack textAlign="center" justify="center" height="84vh">
      <BackgroundImage />
      <Text textAlign="center" fontFamily="Forum, sans-serif" fontSize="6em">
        <Icon m={4} verticalAlign="top" as={GiFlowerPot} />
        Lazy Days Spa
      </Text>
      <Text>Hours: limited</Text>
      <Text>Address: nearby</Text>
    </Stack>
  );
}
```

```jsx
async function getTreatments(): Promise<Treatment[]> {
  const { data } = await axiosInstance.get('/treatments');
  return data;
}

export function useTreatments(): Treatment[] {
  const fallback = [];
  const { data = fallback } = useQuery(queryKeys.treatments, getTreatments);
  return data;
}

export function usePrefetchTreatments(): void {
  const queryClient = useQueryClient();
  queryClient.prefetchQuery(queryKeys.treatments, getTreatments);
}
```

Home에서 Treatments탭으로 이동하면, cache데이터를 먼저 보여준 후, 백그라운드에서 fetch해오는걸 Devtools를 통해서 알 수 있다.

예시)
달력모양으로 된 캘린터에 예약가능한 날짜들이 있다. 
useQuery()의 dependecy에 month까지 의존성을 넣어주어 캐시공간을 분리해준 후,
 컴포넌트 마운트 후 다음달 미리 prefetch하게 useEffect()옵션에 넣어준다.
useQuery()의 keepPreviousData는 background가 바뀌지 않을때만 유용하다. 여기선 예약을 해버리면 바뀌기 때문에 유용하지 않다.

query함수로부터 받아온 데이터를 변형해주는 select옵션을 사용하여 예약된 일정은 filter out해주게 하였다.
select옵션은 최적화가 되어있는데, data가 바뀌었을때와 함수가 변했을때만 실행한다. stable function이 필요하므로 () ⇒ {}라는 anonymous function을 useCallback()으로 감싸주었다.

```jsx
export type AppointmentDateMap = Record<number, Appointment[]>;
const commonOptions = { staleTime: 0, cacheTime: 300000 };
async function getAppointments(
  year: string,
  month: string,
): Promise<AppointmentDateMap> {
  const { data } = await axiosInstance.get(`/appointments/${year}/${month}`);
  return data;
}

// types for hook return object
interface UseAppointments {
  appointments: AppointmentDateMap;
  monthYear: MonthYear;
  updateMonthYear: (monthIncrement: number) => void;
  showAll: boolean;
  setShowAll: Dispatch<SetStateAction<boolean>>;
}

// The purpose of this hook:
//   1. track the current month/year (aka monthYear) selected by the user
//     1a. provide a way to update state
//   2. return the appointments for that particular monthYear
//     2a. return in AppointmentDateMap format (appointment arrays indexed by day of month)
//     2b. prefetch the appointments for adjacent monthYears
//   3. track the state of the filter (all appointments / available appointments)
//     3a. return the only the applicable appointments for the current monthYear
export function useAppointments(): UseAppointments {
  /** ****************** START 1: monthYear state *********************** */
  // get the monthYear for the current date (for default monthYear state)
  const currentMonthYear = getMonthYearDetails(dayjs());

  // state to track current monthYear chosen by user
  // state value is returned in hook return object
  const [monthYear, setMonthYear] = useState(currentMonthYear);

  // setter to update monthYear obj in state when user changes month in view,
  // returned in hook return object
  function updateMonthYear(monthIncrement: number): void {
    setMonthYear((prevData) => getNewMonthYear(prevData, monthIncrement));
  }
  /** ****************** END 1: monthYear state ************************* */
  /** ****************** START 2: filter appointments  ****************** */
  // State and functions for filtering appointments to show all or only available
  const [showAll, setShowAll] = useState(false);

  // We will need imported function getAvailableAppointments here
  // We need the user to pass to getAvailableAppointments so we can show
  //   appointments that the logged-in user has reserved (in white)
  const { user } = useUser();

  const selectFn = useCallback(
    (data) => getAvailableAppointments(data, user),
    [user],
  );

  /** ****************** END 2: filter appointments  ******************** */
  /** ****************** START 3: useQuery  ***************************** */
  // useQuery call for appointments for the current monthYear

  const queryClient = useQueryClient();
  useEffect(() => {
    const nextMonthYear = getNewMonthYear(monthYear, 1);
    queryClient.prefetchQuery(
      [queryKeys.appointments, nextMonthYear.year, nextMonthYear.month],
      () => getAppointments(nextMonthYear.year, nextMonthYear.month),
      commonOptions,
    );
  }, [queryClient, monthYear]);
  // TODO: update with useQuery!
  // Notes:
  //    1. appointments is an AppointmentDateMap (object with days of month
  //       as properties, and arrays of appointments for that day as values)
  //
  //    2. The getAppointments query function needs monthYear.year and
  //       monthYear.month
  const fallback = {};

  const { data: appointments = fallback } = useQuery(
    [queryKeys.appointments, monthYear.year, monthYear.month],
    () => getAppointments(monthYear.year, monthYear.month),
    {
      select: showAll ? undefined : selectFn,
      ...commonOptions,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchInterval: 60000,
    },
  );

  /** ****************** END 3: useQuery  ******************************* */

  return { appointments, monthYear, updateMonthYear, showAll, setShowAll };
}
```

```jsx
export function getAvailableAppointments(
  appointments: AppointmentDateMap,
  user: User | null,
): AppointmentDateMap {
  // clone so as not to mutate argument directly
  const filteredAppointments = { ...appointments };

  // only keep appointments that are open (or taken by the logged-in user) and are not in the past)
  Object.keys(filteredAppointments).forEach((date) => {
    filteredAppointments[date] = filteredAppointments[date].filter(
      (appointment: Appointment) =>
        (!appointment.userId || appointment.userId === user?.id) &&
        !appointmentInPast(appointment),
    );
  });

  return filteredAppointments;
}
```