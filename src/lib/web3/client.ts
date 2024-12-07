import { GraphQLClient } from 'graphql-request'

const NOUNS_SUBGRAPH_URL = 'https://api.goldsky.com/api/public/project_cldf2o9pqagp43svvbk5u3kmo/subgraphs/nouns/prod/gn'

export const nounsClient = new GraphQLClient(NOUNS_SUBGRAPH_URL) 