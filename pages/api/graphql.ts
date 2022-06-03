/**
 * GraphQL Server Endpoint
 *
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { gql, ApolloServer } from "apollo-server-micro";

// Simple keyed schema that gets/sets an integer.
const schema = gql`
  type ValueContainer {
    id: Int!
    value: Int!
  }

  type Query {
    value: ValueContainer!
  }

  type Mutation {
    setValue(value: Int!): ValueContainer!
  }
`;

// (Just store the integer in memory in global for this demo.)
function getValue(): number {
  return (global as any).__count ?? 0;
}

function setValue(value: number): number {
  return ((global as any).__count = value);
}

const resolvers = {
  Query: {
    value: () => ({ id: 0, value: getValue() }),
  },
  Mutation: {
    setValue: (_parent: never, { value }: { value: number }) => ({
      id: 0,
      value: setValue(value),
    }),
  },
};

const apolloServer = new ApolloServer({ typeDefs: schema, resolvers });
const startPromise = apolloServer.start();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await startPromise;
  await apolloServer.createHandler({ path: "/api/graphql" })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
