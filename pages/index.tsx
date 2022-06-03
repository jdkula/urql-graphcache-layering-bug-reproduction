/**
 * Simple demo page. Bring yourself offline and note that
 * the optimistic mutations don't work the second time:
 *  0 -> changes to 0
 *  1 -> changes to 1
 *  0 -> (no change)
 */

import { devtoolsExchange } from "@urql/devtools";
import { offlineExchange } from "@urql/exchange-graphcache";
import type { NextPage } from "next";
import { FC, useEffect, useState } from "react";
import {
  Client,
  dedupExchange,
  fetchExchange,
  gql,
  Provider,
  useMutation,
  useQuery,
} from "urql";
import { makeDefaultStorage } from "@urql/exchange-graphcache/default-storage";

const VALUE_QUERY = gql`
  query Value {
    value {
      id
      value
    }
  }
`;

const SET_VALUE_MUTATION = gql`
  mutation SetValue($value: Int!) {
    setValue(value: $value) {
      id
      value
    }
  }
`;

const VALUE_FRAGMENT = gql`
  fragment _ on ValueContainer {
    __typename
    id
    value
  }
`;

// Creates an offline-ready client
function createClient() {
  const storage = makeDefaultStorage({
    idbName: "graphcache-v1",
    maxAge: 7,
  });

  const client = new Client({
    url: "/api/graphql",
    exchanges: [
      devtoolsExchange,
      dedupExchange,
      offlineExchange({
        storage,
        optimistic: {
          // Optimistically assume that the value will be set correctly
          setValue: (args, cache) => {
            const existing = cache.readFragment(VALUE_FRAGMENT, { id: 0 });
            return {
              ...existing,
              value: args.value,
            };
          },
        },
      }),
      fetchExchange,
    ],
  });

  return client;
}

function useClient() {
  const [client, setClient] = useState<Client | null>(null);

  // This is needed because SSR doesn't have access to IndexedDB...
  useEffect(() => {
    setClient(createClient());
  }, []);

  return client;
}

const Example: FC = () => {
  const [{ data }] = useQuery({ query: VALUE_QUERY });
  const [, setValue] = useMutation(SET_VALUE_MUTATION);
  return (
    <div>
      <div>
        Data: <pre>{JSON.stringify(data)}</pre>
      </div>
      <button onClick={() => setValue({ value: 0 })}>Set value to 0</button>
      <button onClick={() => setValue({ value: 1 })}>Set value to 1</button>
    </div>
  );
};

const Home: NextPage = () => {
  const client = useClient();

  if (!client) {
    return <div>Loading</div>;
  }

  return (
    <Provider value={client}>
      <Example />
    </Provider>
  );
};

export default Home;
