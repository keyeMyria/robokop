DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
export ROBOKOP_HOME="$DIR/../.."
if [ "$DEPLOY" != "docker" ]; then
    export $(cat $ROBOKOP_HOME/shared/robokop.env | grep -v ^# | xargs)
fi

export CELERY_BROKER_URL="amqp://$BROKER_USER:$BROKER_PASSWORD@$BROKER_HOST:$BROKER_PORT/manager"
export CELERY_RESULT_BACKEND="redis://$RESULTS_HOST:$RESULTS_PORT/$MANAGER_RESULTS_DB"
export FLOWER_BROKER_API="http://admin:$ADMIN_PASSWORD@$BROKER_HOST:15672/api/"
export FLOWER_PORT="$MANAGER_FLOWER_PORT"
export FLOWER_BASIC_AUTH=${FLOWER_USER}:${FLOWER_PASSWORD}
export SUPERVISOR_PORT=$MANAGER_SUPERVISOR_PORT
export PYTHONPATH=$ROBOKOP_HOME/robokop