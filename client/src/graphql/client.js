import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';

// * graphql, websocket
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient as createWsClient } from 'graphql-ws';
import { Kind, OperationTypeNode } from 'graphql';
import { getAccessToken } from '../auth';

// * graphql, websocket
// * FOR QUERIES AND MUTATION
const httpLink = new HttpLink({
	uri: 'http://localhost:9090/graphql',
});

// * FOR SUBSCRIPTIONS
const wsLink = new GraphQLWsLink(
	/**
	 * Note: the difference compared to HTTP.
	 * For HTTP request we set the "Authorization" header on every request
	 * while with WebSockets we only pass the token at the start of the connection
	 * and then the authentication will be valid for as long as the websocket connection stays open
	 * no matter how many messages the server and client exchange over time.
	 *
	 * This shows how authentication depends on underlying protocol.
	 * and this is also why i dont have a "login" mutation in the graphql schema.
	 * Authentication is protocol-dependent, and should happen before we pass the request to the Graphql Engine.
	 */
	createWsClient({
		url: 'ws://localhost:9090/graphql',
		connectionParams: () => ({ accessToken: getAccessToken() }),
	})
);

function isSubscription({ query }) {
	const definition = getMainDefinition(query);
	return (
		definition.kind === Kind.OPERATION_DEFINITION &&
		definition.operation === OperationTypeNode.SUBSCRIPTION
	);
}

export const client = new ApolloClient({
	/**
	 * if request uses subscription then use wsLink else use httpLink
	 */
	link: split(isSubscription, wsLink, httpLink),
	cache: new InMemoryCache(),
});

export default client;
