from django.http import JsonResponse

from schedama.dynamodb_ops import select_records_by_type
from schedama.settings import SCHEDAMA_API_TOKEN


def get_total_db_elements(request):
    response = {}

    # Security token
    token = request.headers.get("Authorization")

    if token is None:
        # Security header is missing
        response["result"] = "Error"
        response["description"] = "Ehm...you need a token to see this!"
        return JsonResponse(response, status=401)

    if token != SCHEDAMA_API_TOKEN:
        # Invalid token provided
        response["result"] = "Error"
        response["description"] = (
            "I don't remember the token to be like this! The correct token would be 'AScn9MMu#J3e3@ddSuC4s...' "
            "oh wait...I shouldn't help you with that!")
        return JsonResponse(response, status=403)

    try:
        total_events = len(select_records_by_type("event"))
    except Exception as e:
        response["result"] = "Error"
        response["description"] = str(e)
        return JsonResponse(response, status=500)

    response = {
        "result": "OK",
        "total_events": total_events
    }

    return JsonResponse(response)