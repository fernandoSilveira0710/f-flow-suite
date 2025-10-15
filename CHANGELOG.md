# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [1.0.0] - $(date +%Y-%m-%d)

### Added
- feat(licensing implement comprehensive license sync and plan management
- feat(auth implement offline authentication and license validation
- feat: implement authentication and licensing system
- feat(auth implement comprehensive authentication and licensing system
- feat(licensing implement comprehensive licensing system with cache and validation
- feat(licenses add JWT module to licenses module
- feat: implement auto-update system and site infrastructure
- feat(licensing implement comprehensive licensing system with SQLite support
- feat(users implement user management system with roles and seats
- feat(grooming add categories and resource types modules
- feat(settings add units of measure management
- feat(agenda add AgendaTabs component to profissionais page
- feat: implement CRUD operations for all core modules
- feat: implement MVP feature flags and dashboard modules
- feat(resources add resource event handling and tenant validation
- feat(grooming implement grooming ticket management system
- feat(resources add resource management and appointment integration
- Merge pull request #14 from fernandoSilveira0710/etapa/06-customers-pets-mvp
- feat: implement checkins, appointments and resources modules
- feat(services/professionals implement services and professionals modules with sync
- feat(grooming add CRUD endpoints for services, professionals, and tickets
- feat(customers/pets implement full CRUD for customers and pets management
- feat(inventory implement inventory adjustment event processing and DTOs feat(sync): enhance event ingestion and processing logic feat(products): update product service to handle events feat(db): add OutboxEvent table for event synchronization feat(validation): integrate AJV for event payload validation
- feat(sync dynamically determine aggregate from event type
- feat(sync implement outbox pattern for event synchronization
- feat(sales implement sales module with CRUD operations and validation
- Merge pull request #8 from fernandoSilveira0710/fix-config-prod
- feat(inventory implement event-driven inventory sync between client and hub
- feat(products add products and inventory management modules
- feat(db add business entities and RLS policies for multi-tenant support
- Merge pull request #7 from fernandoSilveira0710/fix-config
- feat(auth improve license token handling and error resilience
- feat(client-local add health check and sync endpoints
- feat(auth implement OIDC and license authentication guards
- feat(licensing enhance license handling and testing
- feat(licensing implement full licensing system with activation, validation and guard
- feat(licensing implement license activation and renewal system
- feat(packaging add fs-extra and improve packaged app database handling
- feat(client add multi-platform service installation and health module
- Merge pull request #2 from fernandoSilveira0710/etapa/02-hub-rls-jwks
- feat(auth add jwks endpoint for license key validation
- Merge pull request #1 from fernandoSilveira0710/etapa/01-setup-dev
- feat: setup development environment and improve code quality
- feat: aprimorar documentação e estrutura do projeto, adicionar suporte a entitlements e métodos de pagamento
- feat(client-local initialize client-local service with basic structure and modules
- feat: Implement grooming check-in and route structure
- feat: Implement Customer CRUD
- feat: Implement CRUD for Staff and Resources
- feat: Implement Payment Methods module
- feat: Add product image support
- feat: Implement PDV module
- feat: Implement Settings module

### Fixed
- feat(licensing implement comprehensive license sync and plan management
- feat(auth implement offline authentication and license validation
- feat(licensing implement comprehensive licensing system with cache and validation
- feat(users implement user management system with roles and seats
- feat: implement checkins, appointments and resources modules
- fix(env remove duplicate SYNC_INTERVAL_MS entry
- fix(installer improve windows service installation reliability
- feat(auth add jwks endpoint for license key validation

### Changed
- feat(licensing): implement comprehensive license sync and plan management
- feat(auth): implement offline authentication and license validation
- feat(licensing): implement comprehensive licensing system with cache and validation
- feat(licenses): add JWT module to licenses module
- feat(users): implement user management system with roles and seats
- feat(grooming): add categories and resource types modules
- refactor(pdv): update cart and sales data structure to use product object
- feat: implement CRUD operations for all core modules
- feat: implement MVP feature flags and dashboard modules
- feat: implement checkins, appointments and resources modules
- feat(grooming): add CRUD endpoints for services, professionals, and tickets
- refactor: simplify soft delete implementation and api client
- refactor(postman): update test collection endpoints and assertions
- refactor(windows-service): remove node-windows dependency and simplify service handling
- feat(auth): add jwks endpoint for license key validation
- refactor: switch from ES modules to CommonJS and update Prisma schemas

### Documentation
- feat(licensing implement comprehensive license sync and plan management
- feat(auth implement offline authentication and license validation
- feat(licensing implement comprehensive licensing system with cache and validation
- feat(licenses add JWT module to licenses module
- feat: implement auto-update system and site infrastructure
- feat(licensing implement comprehensive licensing system with SQLite support
- feat(users implement user management system with roles and seats
- feat: implement MVP feature flags and dashboard modules
- feat: implement checkins, appointments and resources modules
- docs: add comprehensive roadmap for F-Flow Suite MVP to SaaS
- docs: update e2e test command in README
- feat(auth add jwks endpoint for license key validation

### Security
- feat: implement authentication and licensing system
- docs: add comprehensive roadmap for F-Flow Suite MVP to SaaS
- security: remove hardcoded secrets and update .gitignore
- feat(auth): add jwks endpoint for license key validation


### Added
- Auto-update service for client-local application
- Comprehensive CI/CD pipeline with GitHub Actions
- Docker support for hub service
- Security scanning workflows
- Issue templates for bug reports and feature requests
- Contributing guidelines and code of conduct
- Pull request template
- Automated release workflow with changelog generation

### Changed
- Enhanced project structure with proper module organization
- Improved development setup with Docker Compose
- Updated documentation with comprehensive guides

### Security
- Added security scanning with CodeQL, Snyk, and Trivy
- Implemented secret scanning with TruffleHog
- Added license compliance scanning

## [1.0.0] - 2024-01-XX

### Added
- Initial release of F-Flow Suite
- Hub API server with NestJS
- Client Local desktop application
- Site web application
- Professional and service management
- Appointment scheduling system
- Check-in/check-out functionality
- User authentication and authorization
- Database integration with Prisma
- Real-time synchronization between components

### Features

#### Hub (API Server)
- RESTful API with OpenAPI documentation
- User management and authentication
- Professional and service CRUD operations
- Appointment scheduling and management
- Check-in/check-out tracking
- Real-time notifications
- Database migrations and seeding
- Health check endpoints
- Logging and monitoring

#### Client Local (Desktop App)
- Cross-platform desktop application
- Offline-first architecture
- Real-time synchronization with hub
- Professional management interface
- Service configuration
- Appointment calendar
- Check-in/check-out interface
- Auto-update functionality
- System tray integration

#### Site (Web Application)
- Responsive web interface
- Professional directory
- Service booking system
- User dashboard
- Appointment management
- Real-time updates
- Mobile-friendly design

### Technical
- TypeScript throughout the stack
- NestJS for API development
- Electron for desktop application
- React for web interfaces
- PostgreSQL database
- Prisma ORM
- Docker containerization
- Comprehensive testing suite
- ESLint and Prettier for code quality
- GitHub Actions for CI/CD

---

## Release Notes Template

### [Version] - YYYY-MM-DD

#### Added
- New features and functionality

#### Changed
- Changes to existing functionality

#### Deprecated
- Features that will be removed in future versions

#### Removed
- Features removed in this version

#### Fixed
- Bug fixes

#### Security
- Security improvements and fixes

---

## Migration Guides

### Upgrading to v1.1.0
- Update environment variables
- Run database migrations
- Update client applications

### Breaking Changes
- List any breaking changes and migration steps

---

## Support

For questions about releases or upgrade issues:
- Check the [documentation](./README.md)
- Open an [issue](https://github.com/2fsolutions/f-flow-suite/issues)
- Contact support at support@2fsolutions.com.br
