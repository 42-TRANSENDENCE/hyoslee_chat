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

useMutation은 useQuery와 비슷하지만 캐시데이터가 없다. 왜냐하면 one time thing이기 때문이다. 쿼리키가 없다.
그래서 기본으로 no retires이다. 
refetch가 없다. 
캐시데이터가 없으니 isLoadind없다. isFetching만 있다. 
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
뮤테이션할때 appointments관련된 모든 쿼리들을 invalidate시켜야 한다!
Query key Prefixes를 이용할 건데, 관련된 모든 쿼리를 한번에 invalidate시켜준다. 이건 removeQueries에도 있다.
{exact: true} 옵션으로 정확히 할수도 있다.

user appoinments를 위해 [queryKeys.appointments, queryKeys.user, user?.id]
appointments를 위해 [queryKeys.appointments, queryMonthYear.year, queryMonthYear.month] 로, 쿼리키들 앞에 prefix를 전달해주자.

queryClient.removeQueries([queryKeys.appointments, queryKeys.user]); 로도 수정해주었는데, 전체키를 다 입력해줄 필요 없다. removeQueries또한 Query key Prefixes를 사용하기 때문이다.

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

useMutation은 OnMutate 콜백을 가지는데,  context value 반환한다. onError핸들러가 그 context value을 가져가서 이전값이었던 캐쉬값을 다시 저장할수있다. 여기서 context란 optimistic update 적용하기전을 말한다

onMutate는 진행중인 refetches를 취소할수 있다. 예를들어 쿼리를 취소하지 않았다면 쿼리를 refetching하고 있다는거고, refetch하는 동안 캐시를 업데이트할 것이다. Refetch가 서버로부터 오래된 데이터와 함께 come back 하면 우리의 cache를 overwrite하게 된다. 그래서 optimistic update한 후에 서버로부터 온 old data로 cache를 overwrite하기 않게 쿼리를 취소하고 싶은 것이다.(즉 이미 캐시에 반영했는데, 서버에서 온걸 왜 또 반영하냐 이거다)

—공부가 더 필요함