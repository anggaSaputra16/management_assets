#!/bin/bash
# Quick development commands for Linux/macOS

show_help() {
    echo "Management Assets Development Helper"
    echo ""
    echo "Usage: ./dev-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start development environment"
    echo "  stop      Stop development environment"
    echo "  restart   Restart all services"
    echo "  logs      Show logs (optional: specify service name)"
    echo "  clean     Clean up everything (containers, volumes, images)"
    echo "  ps        Show container status"
    echo ""
    echo "Examples:"
    echo "  ./dev-helper.sh start"
    echo "  ./dev-helper.sh logs backend"
    echo "  ./dev-helper.sh clean"
}

case "$1" in
    start)
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    stop)
        echo "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    restart)
        echo "Restarting development environment..."
        docker-compose -f docker-compose.dev.yml restart
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "Showing all logs..."
            docker-compose -f docker-compose.dev.yml logs -f
        else
            echo "Showing logs for $2..."
            docker-compose -f docker-compose.dev.yml logs -f "$2"
        fi
        ;;
    clean)
        echo "Cleaning up containers, volumes, and images..."
        docker-compose -f docker-compose.dev.yml down -v --rmi all
        docker system prune -f
        ;;
    ps)
        echo "Container status:"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    *)
        show_help
        ;;
esac