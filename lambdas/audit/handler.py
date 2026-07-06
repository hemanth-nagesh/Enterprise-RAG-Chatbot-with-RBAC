import os
import json
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
# Default to 'AuditLog' if env var not set
audit_table = dynamodb.Table(os.environ.get('DYNAMODB_AUDIT_TABLE', 'AuditLog'))

def lambda_handler(event, context):
    try:
        print("Fetching audit logs...")
        
        # We can implement query filters later, for now we scan the table
        # Since DynamoDB scan is limited to 1MB, this is fine for an MVP dashboard
        # but in production, a GSI on timestamp should be used.
        response = audit_table.scan()
        items = response.get('Items', [])
        
        # Sort items by timestamp descending
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({"logs": items})
        }
    except Exception as e:
        print(f"Error fetching audit logs: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({"error": "Internal server error."})
        }
