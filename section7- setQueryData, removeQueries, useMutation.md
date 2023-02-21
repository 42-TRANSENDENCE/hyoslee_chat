# section7- setQueryData, removeQueries, useMutation

[막정리]
데이터를 캐시에 직접 세팅하는 setQueryData, 캐시에서 쿼리를 삭제하는 removeQueries.
로그인 기능을 구현해보자.
로그인한 유저관련 정보를 localStorage에도 저장할거고(refresh했을때 로그인 풀려버려서 initialData로 넣을거다),  setQueryData로 캐시에도 저장할거다(다른 곳에서도 유저정보가 필요할 수 있으니 캐시로 사용할 거다)

**useUser()의 역할**

1. 초기화 시 localStorage로부터 로드된다 
2. useQuery를 통해 유저데이터를 최신으로 유지한다 
3. 유저가 업데이트(로그인, 로그아웃, 뮤테이션)때마다 

3.1 setQueryData로 query cache를 업데이트한다

3.2 onSuccess 콜백 안에서 localStorage를 업데이트한다. onSuccess는 setQueryData나 query function후에 실행된다.

useUserAppointments()에서 useUser()가 반환한 user가 로그인해 있을때에만 {enabled: !!user}로 쿼리를 실행하게 하였다. useUserAppointments()의 쿼리는 useUser()의 쿼리에 의존적이니 dependent Queries라고 불른다.

유저데이터를 쿼리캐시에 넣는 이유는, 다른 컴포넌트에서도 캐시를 공유해서 참조하게 하기 위함이다.
localStorage에 넣는 이유는 리프레시할때  영속성을 유지시키기 위함이다. {initialData: getStoredData} 옵션을 주면, 리프레시했을때 localStorage로부터 초기데이터로 잘 추출 해와서 로그인이 유지되는걸 볼 수 있다.

onSuccess는 useQuery, setQueryData후에 실행되는데, removeQueries후에는 실행되지 않는다!!
removeQueries는 이름과 달리 헷갈리게도 여러개를 받지 않는다.

### [요약]

로그인 정보는 클라이언트의 어느 컴포넌트에서든 call해서 모두 돌려쓰게 하기 위해 setQueryData를 사용하여 캐시를 사용하였다. react query는 유저 정보에 대한 provider처럼 사용할 수 있다.
로그인정보라면 캐시에만 저장하면 refresh시 삭제된다. 따라서, 캐시에 넣은후 localStorage에도 넣어야 하는데, 그를 위해 userQuery()의 onSuccess에 명시해주었다.
refresh시 localStorage에 있는 데이터를 초기데이터로 캐시에 넣어 사용해야 한다. 따라서 useQuery()의 initialData에 명시해주었다.
’user-appointments’에 대한 쿼리는 ‘queryKeys.user’에 대한 쿼리에 의존적이다. {enabled: !!user}로 의존적으로 실행하게 하였다.
로그아웃시 유저데이터에 대한 쿼리 캐쉬를 null로 초기화시키고,  removeQueries로 ‘user-appointments’에 대한 쿼리를 삭제해주었다. 

**[Mutation]**

서버에 데이터를 바꾼다. mutation을 쓴다.

- 뮤테이션 하자마자 쿼리를 무효화시키자. 그래야 데이터가 캐시에서 삭제된다. 
- 뮤테이션 후에 서버로부터 반환된 데이터로 캐시를 업데이트해보자
- optimistic UI방법도 있다

mutation도 에러헨들러를 등록할 수 있다.

```jsx
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: queryErrorHandler,
      staleTime: 600000,
      cacheTime: 900000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      onError: queryErrorHandler,
    },
  },
});
```

useIsMutating은 useIsFetching과 유사하다. 현재 mutating중인 갯수를 반환한다.

```jsx
export function Loading(): ReactElement {
  // will use React Query `useIsFetching` to determine whether or not to display
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const display = isFetching || isMutating ? 'inherit' : 'none';
	...
}
```

useMutation은 useQuery와 비슷하지만 캐시데이터가 없다. 왜냐하면 일회성이기 때문이다. 쿼리키가 없다.
그래서 기본으로 no retries이다. 
refetch가 없다. 
캐시데이터가 없으니 isLoading도 없다. isFetching의 개념만 있다. 
mutate함수를 반환한다. 
onMutate 콜백이란게 있는데, optimistic queries에 유용하다.

```jsx
// for when we need functions for useMutation
async function setAppointmentUser(
  appointment: Appointment,
  userId: number | undefined,
): Promise<void> {
  if (!userId) return;
  const patchOp = appointment.userId ? 'replace' : 'add';
  const patchData = [{ op: patchOp, path: '/userId', value: userId }];
  await axiosInstance.patch(`/appointment/${appointment.id}`, {
    data: patchData,
  });
}

export function useReserveAppointment(): UseMutateFunction<
  void,
  unknown,
  Appointment,
  unknown
> {
  const { user } = useUser();
  const toast = useCustomToast();

  // TODO: replace with mutate function
  const { mutate } = useMutation(
    (appointment: Appointment) => setAppointmentUser(appointment, user?.id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([queryKeys.appointments]);
        toast({
          title: 'You have reserved the appointment!',
          status: 'success',
        });
      },
    },
  );

  return mutate;
}
```

onSuccess 없는 상태로 그대로 mutate만 사용하면 예약하려고 눌렀을때 새로고침해야 반영되는게 보여서 UX가 안좋다.
invalidateQueries를 사용해서
- 쿼리가 stale하다고 마킹하고
- 쿼리가 현재 렌더되고 있다면 refetch를 트리거한다.

그래서 순서는

mutate → onSuccess핸들러에 invalidateQueries(관련된 쿼리들)
그러면 refetch된다

여기까지 하면 캘린더에서는 적용되어 보이지만, 나의 예약리스트에선 적용되어 보이지 않는다.
뮤테이션할때 appointments와 관련된 모든 쿼리들을 invalidate시켜야 한다!
Query key Prefixes를 이용할 건데, 관련된 모든 쿼리를 한번에 invalidate시켜준다. 이건 removeQueries에도 있다.
{exact: true} 옵션으로 정확히 할수도 있다.

appointments 관련된 모든 쿼리들을 invalidate시키기 위해서
user appointments를 위해 [queryKeys.appointments, queryKeys.user, user?.id]
appointments를 위해 [queryKeys.appointments, queryMonthYear.year, queryMonthYear.month] 로, 쿼리키들 앞에 prefix를 전달해주자.

queryClient.removeQueries([queryKeys.appointments, queryKeys.user]); 도 수정해주었는데, 전체키를 다 입력해줄 필요 없다. removeQueries또한 Query key Prefixes를 사용하기 때문이다.

mutation 응답으로 캐시를 업데이트 해보자. onSuccess가 서버에서 온 응답을 취해서 캐시를 업데이트 할거다.

```jsx
// for when we need a server function
async function patchUserOnServer(
  newData: User | null,
  originalData: User | null,
): Promise<User | null> {
  if (!newData || !originalData) return null;
  // create a patch for the difference between newData and originalData
  const patch = jsonpatch.compare(originalData, newData);

  // send patched data to the server
  const { data } = await axiosInstance.patch(
    `/user/${originalData.id}`,
    { patch },
    {
      headers: getJWTHeader(originalData),
    },
  );
  return data.user;
}

// TODO: update type to UseMutateFunction type
export function usePatchUser(): UseMutateFunction<
  User,
  unknown,
  User,
  unknown
> {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();

  const { mutate: patchUser } = useMutation(
    (newUserData: User) => patchUserOnServer(newUserData, user),
    {
      onSuccess: (userData: User | null) => {
        if (userData) {
          updateUser(userData);
          toast({
            title: 'User updated!',
            status: 'success',
          });
        }
      },
    },
  );

  return patchUser;
}
```

## [Optimistic update]

useMutation()은 onMutate 속성을 가지고 있는데, mutate를 call하면 서버로 업데이트를 전송하며  onMutate 콜백을 실행한다.
onMutate는 context value를 반환하는데, onError는 이 context value를 이용하여 이전의 cache value로 restore한다.
onMutate는 진행중인 refetches를 취소가능한데, 왜 취소가 필요할까?
취소가 안된다면 query refetch 진행하는 동안 일단 캐시를 업데이트 하는데, refetching후에 통신이 컴백해서 오래된 서버데이터를 가져와서 캐쉬를 overwrite하게 되는 상황이 생긴다. 이거 막아야 해서다.

**[헷갈리니 요약]**

유저가 update를 트리거해서, mutate를 call 하였다.
그러면 서버로 업데이트를 전송하며, onMutate 콜백도 실행된다.
우리는 OnMutate 콜백에서 수동으로 1.진행중인 쿼리를 취소한다(서버로부터 돌아온 데이터가 optimistic data를 대체하지 않게 하려고) 2.쿼리 캐쉬를 업데이트한다 3.이전 캐쉬값을 context로 저장한다
를 진행한다.
Success 시, invalidate query로 서버에서 fresh data를 가져온다.
실패 시, onMutate에서 반환된 context value를 갖고 onError가 실행되며 캐쉬를 롤백한다. 그 후, invalidate query를 하는데, 최신 서버 데이터를 갖기 위함이다.

쿼리가 취소 가능하다?
→ 리액트 쿼리의 query함수들은 취소가능하지 않는데, 가능케 하려면 다음의 format을 지켜야 한다.
- 쿼리를 취소하는 cancel 속성(쿼리 취소함수이다)을 가진 Promise를 반환한다.

쿼리취소함수는 네트워크 call취소하는 방식에 따라 방법이 제각기 다른데, Axios라면 cancel token을 사용한다.
우리가 react query에게 쿼리를 취소하라고 하면, react query는 이 cancel함수를 실행할 것이다.

내부적으로 보면, 리액트 쿼리에서 수동으로 쿼리를 취소할 때 자바스크립트 인터페이스인 AbortController(AbortSignal을 Dom Request에게 전송한다)를 사용한다.
 단, 어떤 쿼리들은 자동으로 취소되는데 out of date거나 unmount가 되는 등의 사유로 inactive queries 일 때 이다.
Axios쿼리를 수동취소 하려면, abort 시그널을 Axios에게 전달한다.(signal은 쿼리함수의 매개변수로써 오게된다)
내부 작동을 보면, useQuery()는 AbortController를 관리하는데, 이 AbortController는 query함수(getUser)에게 전달되는 signal을 생성한다. query함수는 Axios에게 시그널을 전달한다.
Axios는 그 시그널을 구독하게 되어, cancellation event에 대해 listening하게 된다.
queryClient.cancelQuery(queryKeys.user)를 실행하면, AbortController에게 cancel event를 전송한다.
그러면 그 시그널을 구독한 Axios콜은 cancel Event를 듣고 Abort 하게 된다.

```jsx
async function getUser(
  user: User | null,
  signal: AbortSignal,
): Promise<User | null> {
  if (!user) return null;
  const { data }: AxiosResponse<{ user: User }> = await axiosInstance.get(
    `/user/${user.id}`,
    {
      headers: getJWTHeader(user),
      signal,
    },
  );
  return data.user;
}

export function useUser(): UseUser {
  // TODO: call useQuery to update user data from server
  const queryClient = useQueryClient();
  const { data: user } = useQuery(
    queryKeys.user,
    ({ signal }) => getUser(user, signal),
    {
      initialData: getStoredUser(),
      onSuccess: (received: User | null) => {
        if (received) {
          setStoredUser(received);
        } else {
          clearStoredUser();
        }
      },
    },
  );

	// meant to be called from useAuth
  function updateUser(newUser: User): void {
    queryClient.setQueryData(queryKeys.user, newUser);
  }
	...
}
```

user정보를 가져오는 getUser에게 취소signal을 보내는 것이었다.

사용자 페이지에서 유저 정보의 주소를 바꾸려고 할때 네트워크 실패하여 revert하는 optimistic update를 확인해볼것이다.

```jsx
// TODO: update type to UseMutateFunction type
export function usePatchUser(): UseMutateFunction<
  User,
  unknown,
  User,
  unknown
> {
  const { user, updateUser } = useUser();
  const toast = useCustomToast();
  const queryClient = useQueryClient();

  const { mutate: patchUser } = useMutation(
    (newUserData: User) => patchUserOnServer(newUserData, user),
    {
      // onMutate는 onError에게 전달되는 context를 반환한다.
      onMutate: async (newData: User | null) => {
        // 유저데이터에 대해 발신하는 쿼리들을 취소한다. 오래된 서버 데이터가 optimistic update를 덮어쓰는 것을 방지한다.
        queryClient.cancelQueries(queryKeys.user);

        // 이전 유저데이터를 저장한다. 만약 에러가 발생하면 이전 데이터로 롤백한다.
        const previousUserData: User = queryClient.getQueryData(queryKeys.user);

        // 새로운 유저 데이터로 캐시를 optimistically update한다.
        updateUser(newData);

        return { previousUserData };
      },
      onError: (error, newData, context) => {
        if (context.previousUserData) {
          updateUser(context.previousUserData);
          toast({
            title: 'Update failed; resotring previous value',
            status: 'warning',
          });
        }
      },
      onSuccess: (userData: User | null) => {
        if (userData) {
          // updateUser(userData); // optimistic update에서 미리 했기때문에 필요없어용
          toast({
            title: 'User updated!',
            status: 'success',
          });
        }
      },
      // mutation을 resolve하면 error든 success든 settled를 콜한다.
      onSettled: () => {
        // 최신 서버 데이터를 가져오기 위해 쿼리를 다시 fetch한다.
        queryClient.invalidateQueries(queryKeys.user);
      },
    },
  );
```

**[요약]** 

뮤테이션을 보낸다. 
발신하는 쿼리들을 취소시킨다. 
캐시를 업데이트한다. 
previous value를 저장한다. 
필요시(error시) 롤백한다.