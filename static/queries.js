export const USER_QUERY = `
    query {
        user {
            id
            login
            firstName
            lastName
            attrs
        }
    }
`;

export const XP_QUERY = `
    query {
        transaction_aggregate(
            where: {
                type: { _eq: "xp" }
                path: { _like: "%/bh-module/%" }
                _or: [
                    { path: { _nlike: "%/piscine%" } }
                    { path: { _eq: "/bahrain/bh-module/piscine-js" } }
                    { path: { _eq: "/bahrain/bh-module/piscine-rust" } }
                ]
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
`;

export const TOTAL_AUDITS_QUERY = `
    query auditTotal {
        done: transaction_aggregate(
            where: { type: { _eq: "up" } }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }

        received: transaction_aggregate(
            where: { type: { _eq: "down" } }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
`;

export const CURRENT_LEVEL_QUERY = `
    query {
        transaction(
            where: { type: { _eq: "level" } }
            order_by: { createdAt: desc }
            limit: 1
        ) {
            amount
            createdAt
        }
    }
`;
export const PASS_FAIL_QUERY = `
    query {
      result(
        where: { object: { type: { _eq: "project" } } }
      ) {
        grade
        object {
          name
        }
      }
    }
`;

export const XP_PER_PROJECT_QUERY = `
    query {
        transaction(
            where: {
                type: { _eq: "xp" }
                object: { object_type: { type: { _eq: "project" } } }
            }
            order_by: { amount: desc }
            limit: 20
        ) {
            amount
            path
            createdAt
            object {
                name
                object_type {
                    type
                }
            }
        }
    }
`;

export const XP_PROGRESS_QUERY = `
    query {
        transaction(
            where: {
                type: { _eq: "xp" }
                object: { object_type: { type: { _eq: "exercise" } } }
                path: { _like: "%bh-piscine%" }
            }
            order_by: { amount: desc }
            limit: 10000
        ) {
            amount
            path
            createdAt
            object {
                name
                object_type {
                    type
                }
            }
        }

        transaction_aggregate(
            where: {
                type: { _eq: "xp" }
                object: { object_type: { type: { _eq: "exercise" } } }
                path: { _like: "%bh-piscine%" }
            }
        ) {
            aggregate {
                sum {
                    amount
                }
            }
        }
    }
`;
