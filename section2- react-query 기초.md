# section2

## **useQuery**

리액트에서 서버에 대한  상태를 관리할때 비동기 요청마다 각각 pending, fulfilled, rejected 상태를 만들어줘야 하는데, 여간 귀찮은게 아니다.
따라서 react-query의 useQuery()를 써보자!
다음과 같이 비동기 요청에 query keys(첫번째 매개변수; dependency arrays이다.)를 달아주고, 해당 query keys에 대해서 다른 컴포넌트에서 중복 원격호출 방지(로컬캐시 사용)를 해준다.

```jsx
async function fetchPosts(pageNum) {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/posts?_limit=10&_page=${pageNum}`
  );
  return response.json();
}

export function Posts() {

	const { data, isError, error, isLoading, isFetching } = useQuery(
	    ["posts", currentPage],
	    () => fetchPosts(currentPage),
	    /*{
	      staleTime: 2000,
	    }*/
	  );
	
	if (isLoading) return <h3>Loading...</h3>;
	if (isError)
	  return (
	    <>
	      <h3>Oops, something went wrong</h3>
	      <p>{error.toString()}</p>
	    </>
	  );

	return (
		<>
			{data.map.~~(중략) }
		</>
	)
}
```

ReactQueryDevtools로 확인해보면 기본 옵션으로는 fetching→stale 로 바로 바뀌는걸 확인할 수 있다.
이것은 기본 staleTime: 0ms 여서 그렇다. 왜 0ms가 기본일까? 우리 눈에 보이는 데이터가 항상 최신이어야 마땅하기 때문이다.

세번째 매개변수 옵션으로 {staleTime : 2000}을 주면 2초간 fresh 후→stale 로 바뀌는걸 확인할 수 있는데,
 fresh상태일때는 원격으로 fetch를 하고싶어도 fetch가 실행되지 않는다.

**staleTime과 cacheTime을 비교해보자.**
[staleTime]
staleTime은 알다시피 (원격으로) refetching을 할때에 대한 고려사항이다.

[cacheTime]
일단 cache는 활성화된 useQuery가 없다(fetcing또는 refetching한게 없다)면 쿼리가 “cold storage”에 들어가는데, 캐시 데이터는 cacheTime후에 만료된다(기본 5분).
cacheTime은 마지막 활성화된 useQuery후에 얼마나 지났는지에 대한 시간, 즉 페이지에 그려진 컴포넌트가 특정 쿼리에대한 useQuery를 사용한 후 얼마나 지났는지에 대한 시간이다.
cacheTime 만료가 되면 데이터는 쓰레기 수집되고, 더이상 client에게 유효하지 않다.

데이터가 cache안에 있다면 fetching하는동안 이 캐시데이터를 보여줄 것인데, 캐시데이터를 안보여주면 빈 페이지가 보이기 때문에 실시간 데이터가 필요한 상황(이때는 캐시타임을 0으로 셋팅하자)이 아닌 이상 훨씬 낫다. 
또, 데이터가 fetch되는걸 막지 않기때문에 서버로부터 최신 데이터로 refresh될 수 있다.

[[뭔말인지 모르겠으니 예시를 보자..]](https://medium.com/doctolib/react-query-cachetime-vs-staletime-ec74defc483e)
- staleTime: 1m
- cacheTime: 5m
00:00:00에 유저가 포스트 목록을 fetch해왔다. 이 순간 백엔드 응답데이터가 React Query에 저장되고 5분후에 만료된다. 이 데이터는 다음 1분동안은 fresh 상태로 유지된다.
00:00:30에 유저가 또 요청을 한다. 캐시가 유효하므로 그것을 유저에게 준다. **부차적으로**, 쿼리 역시 fresh하므로 background콜을 하지 않는다.
00:04:30에 유저가 또 요청을 한다. 캐시가 유효하므로 그것을 유저에게 준다. **부차적으로**, 쿼리는 stale하므로 background콜을 한다. 응답이 return되면 React Query는 유저에게 제공된 그 데이터를 업데이트 할것이고 cache에 새로운 값을 다음 5분간 저장할 것이다.

쿼리에 대한 데이터는 다음 사항이 trigger될때마다 refetch 된다.

- component remount
- window refocus
- running refetch function(useQuery가 반환하는 함수들)
- automated refetch(ex: 특정주기마다 자동으로 refetch하게하는거)
- query invalidation after a mutation (mutation한 후에 query를 무효화시켜 클라이언트에 있는 데이터가 서버와 일치하지 않게 하기)

**[prefetch]**

다음은 Pagination되어있는, next버튼을 눌러 그다음 포스트를 가져오게 하는 기능인데, next버튼을 누르기 전에 미리 prefetch한다면 미리 캐시에 데이터를 넣어두니 얼마나 빨라서 좋을까? prefetch는 이러한 Pagination 뿐만 아니라 사람들이 자주 접속할거 같은 사이트를 미리 prefetch하는 등 여러 방안으로 쓸 수 있다.
 또한 {keepPreviousData: true} 옵션으로 prev버튼을 누를때를 위하여 이전 데이터에 대한 캐시를 유지하게 하였다.

```jsx
export function Posts() {
	...
	const queryClient = useQueryClient();

  //prefetch next page
  useEffect(() => {
    if (currentPage < maxPostPage) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery(["posts", nextPage], () =>
        fetchPosts(nextPage)
      );
    }
  }, [currentPage, queryClient]);

  // replace with useQuery
  const { data, isError, error, isLoading, isFetching } = useQuery(
    ["posts", currentPage],
    () => fetchPosts(currentPage),
    {
      staleTime: 2000,
      keepPreviousData: true,
    }
  );
	...
}
```

**[isLoading vs isFetching]**

isFetching

- async 함수가 아직 resolve되지 않았다.(isLoading보다 더 포괄적인 개념)

isLoading

- isFetching중인데, cached Data가 없다.

**[Mutation]**

→ 서버에 있는 데이터를 변경하는 network call을 하는것을 말한다

변화가 일어났다!라는걸 유저에게 보여주는 방법은 뭐가 있을까?
1. Optimistic updates라는 기법이 있는데, 변화가 정상적으로 일어날 것이다라고 가정하여 미리 UI를 업데이트하는 것이다. 백엔드에서 변화가 실패하면? 그때가서 되돌리면 된다.(롤백)
2. mutation을 행한 후 서버로부터 반환된 데이터를 가져와서, 그 업데이트된 데이터로 react query cache를 call하고 update하는 것이다.
3. 관련된 query를 invalidate해서 서버로부터 데이터를 refetch하는 방법이다.

다음은 예시이다. useMutation()은 캐시와 관련된게 아니므로 query Key를 사용하지 않는다.

```jsx
async function deletePost(postId) {
  const response = await fetch(
    `https://jsonplaceholder.typicode.com/postId/${postId}`,
    { method: "DELETE" }
  );
  return response.json();
}

export function PostDetail({ post }) {
  // replace with useQuery
  const { data, isError, error, isLoading } = useQuery(
    ["comments", post.id],
    () => fetchComments(post.id)
  );

  const deleteMutation = useMutation((postId) => deletePost(postId));

  if (isLoading) return <div>Loading</div>;

  return (
    <>
      <h3 style={{ color: "blue" }}>{post.title}</h3>
      <button onClick={() => deleteMutation.mutate(post.id)}>Delete</button>
      {deleteMutation.isError && (
        <p style={{ color: "red" }}> Error deleting the post</p>
      )}
      {deleteMutation.isLoading && (
        <p style={{ color: "purple" }}> Deleting the post</p>
      )}
      {deleteMutation.isSuccess && (
        <p style={{ color: "green" }}> Post has (not) been deleted</p>
      )}
      <p>{post.body}</p>
      <h4>Comments</h4>
      {data.map((comment) => (
        <li key={comment.id}>
          {comment.email}: {comment.body}
        </li>
      ))}
    </>
  );
}
```