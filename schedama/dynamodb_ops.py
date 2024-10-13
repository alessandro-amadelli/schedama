"""
This script contains all the functions used to fetch, insert, update or delete data
from the DynamoDB table.

Author: Ama
"""

import os
from datetime import datetime
import secrets

import boto3
from boto3.dynamodb.conditions import Key

# Connection to dynamoDB using TEST or PRODUCTION credentials based on environment
if os.environ['SCHEDAMA_ENVIRONMENT'] == 'PRODUCTION':
    AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
    AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
    dynamodb = boto3.resource(
        'dynamodb', region_name='eu-central-1',
        aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
else:
    AWS_ACCESS_KEY_ID = os.environ["TEST_AWS_ACCESS_KEY_ID"]
    AWS_SECRET_ACCESS_KEY = os.environ["TEST_AWS_SECRET_ACCESS_KEY"]
    dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8080")

table = dynamodb.Table('schedama_table')


# SELECT OPERATIONS #
def select_records_by_type(item_type):
    response = table.query(
        ScanIndexForward=True,
        KeyConditionExpression=Key('item_type').eq(item_type)
    )
    return response['Items']


def select_record_by_id(item_id, item_type):
    response = table.query(
        ScanIndexForward=True,
        KeyConditionExpression=Key('item_type').eq(item_type) & Key('item_id').eq(item_id)
    )

    if len(response['Items']) > 0:
        return response['Items'][0]

    return []


# INSERT OPERATIONS #
def get_new_item_id(item_type):
    UID_LENGTH = 6

    for i in range(100):
        new_id = secrets.token_urlsafe(UID_LENGTH)
        if not select_record_by_id(new_id, item_type):
            return new_id
    return False


def generate_admin_key():
    KEY_LENGTH = 32
    return secrets.token_urlsafe(KEY_LENGTH)


def generate_participant_id(participant_ids):
    """
    This function generates a unique ID for each participant.
    The ID must be unique in the event scope so the function
    receives a list of all existing UIDs
    """
    UID_LENGTH = 6
    while True:
        uid = secrets.token_urlsafe(UID_LENGTH)
        if uid not in participant_ids:
            return uid


def check_participants(participants):
    """
    Check if each participant has a UID and generates a new one if missing.
    The function returns the fixed participants list
    """
    participant_ids = [p.get("uid", None) for p in participants]

    for p in participants:
        # Get participant's UID
        pid = p.get("uid", None)
        if not pid:
            # Participant is without ID, so a new ID is generated and assigned to participant
            pid = generate_participant_id(participant_ids)
            p["uid"] = pid
            # New participant's id is appended to the list
            participant_ids.append(pid)
        p["dates"] = p.get("dates", [])

    return participants


def insert_record(record_data):
    # Check if it's an insert or update operation based on item_id presence
    if "item_id" not in record_data.keys():
        # INSERT OPERATION: generating fields for new record

        # Generating item_id
        item_id = get_new_item_id(record_data["item_type"])
        if not item_id:
            return False
        record_data["item_id"] = item_id

        # Generating admin_key
        admin_key = generate_admin_key()
        record_data["admin_key"] = admin_key

        # Adding creation_date field
        timestamp = datetime.now().strftime("%Y-%m-%d h.%H:%M:%S.%f")
        record_data["creation_date"] = timestamp

    # Checking and fixing participants
    record_data["participants"] = check_participants(record_data["participants"])

    # Updating last modification date
    record_data["last_modified"] = datetime.now().strftime("%Y-%m-%d h.%H:%M:%S.%f")

    table.put_item(Item=record_data)
    return record_data


# UPDATE OPERATIONS #
def update_single_event(item_id, item_type, update_dict=dict()):
    """
    Updates values on one or more field of an event record.
    update_dict is a dictionary with the following format:
      {"field": "value", ...}
    """
    if not update_dict:
        return False

    if "participants" in update_dict.keys():
        # Check and fix participants list
        update_dict["participants"] = check_participants(update_dict["participants"])

    update_expression = "SET"
    expression_attribute_values = {}

    i = 0
    for i, (k, v) in enumerate(update_dict.items()):
        if len(update_expression) > 3:
            update_expression += ","
        update_expression += f" {k} = :v{i}"
        expression_attribute_values[f":v{i}"] = v

    # Updating last_modified timestamp
    last_modified = datetime.now().strftime("%Y-%m-%d h.%H:%M:%S.%f")
    update_expression += f", last_modified = :v{i+1}"
    expression_attribute_values[f":v{i+1}"] = last_modified

    response = table.update_item(
        Key={
            "item_id": item_id,
            "item_type": item_type
        },
        UpdateExpression=update_expression,
        ExpressionAttributeValues=expression_attribute_values
    )

    return response


# DELETE OPERATIONS #
def delete_single_record(item_id, item_type):
    deleted_record = table.delete_item(
        Key={
            'item_type': item_type,
            'item_id': item_id
        }
    )
    return deleted_record