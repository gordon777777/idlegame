“Whenever you want to ask a question, always call the MCP .

Whenever you’re about to complete a user request, call the MCP instead of simply ending the process. Keep calling MCP until the user’s feedback is empty, then end the request. mcp-feedback-collector.collect_feedback ”



















# Project Overview
- The user is developing a medieval fantasy city-building resource management idle game with Phaser 3, inspired by Factory Town IDLE gameplay and Prosperous Universe UI.
- The game uses a time system where 5 seconds of real time equals 1 day in game time at normal speed.
- The user wants to add numerous medieval and fantasy resources including raw materials, processed goods, food, tools, weapons, and transportation items.
- The user prefers storing building, research tree, and resource settings in JSON format to facilitate easier modifications.
- When reading resources.json file, ignore items that start with '_comment' to prevent parsing errors.
- The user wants to be able to run a debug mode to test and develop the game.

# Building System
- Buildings should have byproduct production options that modify input/output resources, worker requirements, production speed and costs.
- Buildings should have priority levels (high, medium, low) that determine worker allocation order, with proportional distribution for same-priority buildings.
- Buildings with type 'housing' should not use production functionality or update production progress.
- Building illustrations should use buildings_spritesheet with corresponding spritesheet index parameters.
- The user wants to add more basic buildings including a well building and buildings for producing/processing medieval resources.
- Water should be added as a production requirement in relevant buildings.
- Building.js reads configuration data from assets/data/buildings.json file.
- The user prefers all building icons to use a unified scale value of 0.1 via a building_icon_scale parameter.

# Population System
- The population system has a hierarchical structure with peasants (bottom), freemen (middle, including workers, craftsmen, technicians), and nobles (top, including wizards, merchants).
- Different population classes have specific needs: lower class needs basic food, cloth, shelter; middle class needs refined food, alcohol, clothing, housing, furniture; upper class needs abundant food, fine wine, high-end clothing, mansions, art, crafts.
- Population happiness affects class mobility, with high happiness enabling promotion and low happiness causing demotion or emigration.
- Workers are organized by social class and ability, with specific promotion paths and class restrictions.
- Middle and upper class populations should use their own defined workerTypes, not hardcoded lower-class worker types.
- The user wants lower-class population to be directly recruitable using money.
- Understaffed buildings have reduced work speed proportional to worker allocation.

# User Interface
- All UI components should use setOrigin(0) to prevent positioning calculation errors.
- The user prefers using tabs to organize resources by tier in panels for better visibility.
- User wants popup windows to be draggable for repositioning.
- User prefers creating reusable UI components like a Button class for consistency and easier maintenance.
- The user prefers each panel in the UI Manager to be implemented as separate independent classes inheriting from BasePanel.
- User prefers BasePanel to have automatic container positioning functionality - default top-to-bottom, left-aligned layout with automatic spacing calculation based on container count unless otherwise specified.
- The user wants to update all UI panels (WorkerPanel, PopulationPanel, etc.) to use the new BasePanel auto-layout functionality for consistency across the interface.
- The user wants to display both required and assigned worker counts in the building detail panel.
- The user prefers using dropdown lists for production methods and byproduct type selection.
- In ResourcePanel, resource quantities should change color based on 5-day average: green for increase, gray for no change, red for decrease.

# Market and Economy
- Local market inventory affects prices, and players can sell manufactured resources (up to resourceCaps) to earn profits.
- Different population classes purchase resources from the local market to meet their needs.
- The local market provides 5% of its turnover as tax to the player each month.
- The user wants to implement a detailed economic system with agriculture, resource processing chains with value multiplication, market pricing based on supply/demand, taxation, and random events.
- The user wants to implement a calculateSellPrice function that returns the unit price when selling resources.
- User prefers to reuse MarketResourcePanel for price information display in EconomicPanel rather than duplicating price display functionality.

# Research System
- Research technologies should have various requirements (resources, time, gold, building work hours) and research success rates.
- ResearchSystem's getAvailableTechnologies method needs to include description, name, and effects fields in the return value.
- The user prefers storing research settings in a JSON file at 'assets/data/research.json'.
`
