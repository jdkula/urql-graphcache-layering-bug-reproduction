This is a minimal reproduction of a bug(?) in `@urql/exchange-graphcache`,
where optimistic mutations seem to be incorrectly applied/layered while
waiting for responses in certain cases.

tl;dr: Identical mutations will update old optimistic layers, even if that
data has been changed in more recent optimistic layers. To see what this does,
run the demo with `yarn install; yarn dev`, go to `http://localhost:3000`,
then kill the server (so we make use of optimistic/offline).

This demo defines a simple keyed graphql schema, which looks like this:

```graphql
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
```

For the purposes of this demo, there is only one `ValueContainer` with `id: 0`.

The demo page reports the value retrieved from the server (and later cache),
and provides two buttons to set the value to either of 0 or 1. The urql client
has an offline cache set up, along with an optimistic mutation response for `setValue`
(which simply sets the value in `ValueContainer:0` to the `value` supplied in
the mutation's arguments).

You can observe the bug by allowing the webpage to load, and then cutting the server
(so urql makes use of the offline cache).

1. Click either button; observe the value changes.
2. Click the other button; observe the value still changes.
3. Then, click either button; observe that the value no longer changes (until you are online.)

This appears to be happening because graphcache is searching its optimistic layers
for a mutation with a matching key (hashed from the document and arguments), and updating
that layer. This behavior seems to be incorrect, however, as the value has since been
updated by more recent layers, and thus the new mutation's results are being lost.
