##APIs
  



#### Date Availabilty API:
```json
{
  "dates": [
    {
      "date": "2025-03-23",
      "price": {
        "currencyCode": "SGD",
        "discount": 0,
        "finalPrice": 341,
        "originalPrice": 441
      },
      "variantIds": [122]
    },
    {
      "date": "2025-03-24",
      "price": {
        "currencyCode": null,
        "discount": 0,
        "finalPrice": null,
        "originalPrice": null
      },
      "variantIds": []
    }
  ]
}
```
### Slots API
This API provides detailed information about available slots, including pricing and availability.

#### Output Example:
```json
{
  "slots": [
    {
      "startTime": "00:00",
      "startDate": "2025-03-23",
      "price": {
        "finalPrice": 341,
        "currencyCode": "SGD",
        "originalPrice": 441
      },
      "remaining": 170,
      "paxAvailability": [
        {
          "type": "ADULT_12~99",
          "name": "Adult",
          "description": "12-99 years",
          "price": {
            "finalPrice": 341,
            "currencyCode": "SGD",
            "originalPrice": 441
          },
          "min": 1,
          "max": 20,
          "remaining": 150
        },
        {
          "type": "CHILD_5~15",
          "name": "Child",
          "description": "5-15 years",
          "price": {
            "finalPrice": 137,
            "currencyCode": "SGD",
            "originalPrice": 237
          },
          "min": 1,
          "max": 20,
          "remaining": 10
        },
        {
          "type": "INFANT_0~4",
          "name": "Infant",
          "description": "0-4 years",
          "price": {
            "finalPrice": 0,
            "currencyCode": "SGD",
            "originalPrice": 0
          },
          "min": 1,
          "max": 20,
          "remaining": 10
        }
      ]
    }
  ]
}
```

# Project Optimizations that can be done


## Increasing Threadpool limit, Looking at the metrics to set the optimal limit

<!-- ## Batching Database Writes
- Batching it out, if the process interupts, can be continued from that batch onwards than starting it from first
- Current Approach: Each API call triggers a separate database write for a single entry.
- Optimized Approach: Process data in batches to reduce the number of database writes.
  - Preprocess the data and store it in an array.
  - Use Prisma's `createMany` with nested writes method to perform a single write operation for multiple entries, improving efficiency. -->

## Message Queues and Worker Pool
- Implement message queues to delegate asynchronous tasks for better scalability.
- Use worker pool to handle these tasks and distribute the load to a worker.

## Retry Mechanisms
- Handle interruptions in processes by implementing retry mechanisms.

## Database Sharding and Horizontal Scaling
- Implement database sharding to split data across multiple databases or nodes based on specific criteria, improving read/write performance.
- Enable horizontal scaling to handle increased traffic by adding more servers or nodes.



