const dashboard_id = '635685b4b654c20037109efb'
// id of the widget with buttons
const blox_widget_id = '63a5bc1f8fbb4c00360742dd'
// id of the widget which buttons modify
const widget_id = '63a5bbfc8fbb4c00360742d9'
const categories_to_choose = ['Client', 'Client Division', 'Industry', 'Sector', 'Language Delivery Team', 
							  'LD Cost Centre', 'LxD Business Unit', 'LxD Cost Center Type', 'LxD Region', 'Source Language', 'Source Language Group', 
							  'Target Language', 'Target Language Group', 'Done', 'Report Month', 'Financial year', 'Report Date', 'Task', 'Task Type', 'Task Unit'] 
const values_to_choose = ['Total Adjusted Words', 'Average Adjusted Words', 'Min Adjusted Words', 'Max Adjusted Words']
const columns_for_filters = categories_to_choose
const break_by_to_choose = categories_to_choose

// variable indicating to which tables different columns belong
// you need to pass here names of all tables and columns which will be used by buttons
const tables = {'Dim_CC_clients': ['Client', 'Cost Code', 'Client Division', 'Industry', 'Sector'],
				'Dim_CCH_LO': ['Language Delivery Team', 'LD Cost Centre', 'LxD Business Unit', 'LxD Cost Center Type', 'LxD Region'],
				'Dim_CCH_PMO': ['PMO Business Sub Unit', 'PMO Cost Centre', 'PMO Business Unit', 'PMO Cost Center Type', 'PMO Region'],
				'Dim_source_language': ['Source Language', 'Source Language Group'],
				'Dim_target_language': ['Target Language', 'Target Language Group'],
				'Fact_WordsReceived_ProRata': ['Done', 'Report Month', 'Financial year', 'Report Date', 'Task', 'Task Type', 'Task Unit']}
	

const modal_ids = []
columns_for_filters.forEach(column => modal_ids.push('modal_' + column.split(' ').join('_')))

widget.on('ready', () => {
	// widget with the graph which we want to modify with the buttons
	const graph_widget = prism.activeDashboard.widgets.$$widgets.find(w => w.oid == widget_id)
	// selected filters of the graph
	const graph_filters = graph_widget.metadata.panels[3].items

	// creating options to choose for filters, categories, values and break by
	add_columns_for_filters(columns_for_filters)
	add_values_to_choose(categories_to_choose, 'categories_to_choose')
	add_values_to_choose(values_to_choose, 'values_to_choose')
	add_values_to_choose(break_by_to_choose, 'break_by_to_choose')
	// add_categories_to_choose(categories_to_choose)
	// add_values_to_choose(values_to_choose)
	// add_break_by_to_choose(break_by_to_choose)

	// creating modals where user select values for the filters
	for (let column of columns_for_filters)
	{
		create_modal(column)
	}

	// adding buttons with filter values which were already selected to the modals
	// coloring buttons with columns which are in active filters
	for (let filter of graph_filters)
	{
		let filter_column = filter.jaql.column
		let modal_button = document.querySelector(`[id=${filter_column.split(' ').join('_')}]`)
		let modal = document.querySelector(`[id=modal_${filter_column.split(' ').join('_')}`)

		if (modal == null) continue
		
		let selected_filter_values = modal.querySelector('[id=selected_filters]')

		if (filter.jaql.filter.members == undefined)
			filter.jaql.filter.members = []

		for (let member of filter.jaql.filter.members)
		{
			let new_filter_button = create_filter_button(member)
			selected_filter_values.appendChild(new_filter_button)
		}

		if (!filter.disabled)
			modal_button.classList.add('selected')

		// adding event listeners to the buttons with selected filters such that they disappear after clicking on them
		modal.querySelectorAll('[class*=selected_filter').forEach(el => el.addEventListener('click', (event) => {
			event.target.remove()
		}))
	}

	// creating buttons with saved filters
	for (let modal_id of modal_ids)
	{
		create_buttons_with_saves(modal_id, dashboard_id, blox_widget_id)
	}


	// adding event listeners to the buttons for closing modals
	const close_modal_buttons = document.querySelectorAll('[data-modal-close]')
	close_modal_buttons.forEach(button => {
		button.addEventListener('click', () => {
			const modal = button.closest('.modal')
			closeModal(modal)
		})
	})

	// adding event listeners to buttons for entering filter values (creating buttons with filter values)
	for (let modal_id of modal_ids){
		let modal = document.querySelector(`[id=${modal_id}]`)
		let enter_button = modal.querySelector('[id=enter_button]')

		enter_button.addEventListener('click', () => {
			const input = modal.querySelector('[id=filter_values]')
			const entered_filter_values = input.value.split(', ')
			const selected_filters_list = modal.querySelector('[id=selected_filters]')

			// clear input after clicking on Enter
			input.value = ''

			for (let filter_value of entered_filter_values)
			{
				// creating buttons for each entered filter
				let new_filter_button = create_filter_button(filter_value)
				selected_filters_list.appendChild(new_filter_button)
			}

			// button which opens that modal should be marked as selected after entering values for filter
			let open_modal_button = document.querySelector(`[id=${modal_id.split('modal_')[1]}`)
			if (!open_modal_button.classList.contains('selected'))
				open_modal_button.classList.add('selected')
		})
	}

	// adding event listeners to buttons for saving filter configuration
	for (let modal_id of modal_ids)
	{
		let modal = document.querySelector(`[id=${modal_id}]`)
		let save_filter_button = modal.querySelector('[id=save_filter]')

		save_filter_button.addEventListener('click', () => {
			const input = modal.querySelector('[id=input_save_filter_name]')
			const entered_filter_name = input.value
			const selected_filter_values = []
			// entering selected filter values into the list selected_filter_values
			modal.querySelectorAll('[id=selected_filters] button').forEach(button => selected_filter_values.push(button.value))

			// clear input after saving
			input.value = ''

			// saving fitlers in localStorage
			// current_saved_blox_configs has format: 
			// {dashboard_id: {blox_widget_id: {categories_filters: {save_name: list_of_filter_values}, values_filters: {save_name: list_of_filter_values}, ...}}}
			let current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)

			let key = modal_id.split('_').slice(1).join(' ')

			// check if there is already save with given name
			if (Object.keys(current_saved_blox_configs[dashboard_id][blox_widget_id][key]).includes(entered_filter_name))
			{
				alert('there is already such a save name, choose a different name')
				return
			}

			// modify saved filters
			current_saved_blox_configs[dashboard_id][blox_widget_id][key][entered_filter_name] = selected_filter_values
			// save modified filters
			localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)

			// creating button with save in the modal with saves
			create_buttons_with_saves(modal_id, dashboard_id, blox_widget_id)
		})
	}

	// adding event listeners to buttons for clearing selected filters
	for (let modal_id of modal_ids){
		let modal = document.querySelector(`[id=${modal_id}]`)
		let clear_filter_list_button = modal.querySelector('[id=clear_filters]')

		clear_filter_list_button.addEventListener('click', () => {
			const selected_filters = modal.querySelectorAll('[id=selected_filters] button')
			for (let selected_filter of selected_filters) 
				selected_filter.remove()
		})
	}

	// adding event listeners to apply button for applying choosen configuration to the graph
	document.getElementById('apply_button').addEventListener('click', (event) => {
		// getting selected columns for filters, categories, values and break by values
		// selected_filters has format: {column1: [values for filter], column2: ...}
		const selected_filters = {}
		document.querySelectorAll('[id=columns_for_filters] [class*=selected]').forEach(
			button_filter_column => 
			{
				selected_filters[button_filter_column.value] = []
				// modal which is opened by button in which are contained selected filters
				let modal_id = 'modal_' + button_filter_column.value.split(' ').join('_')
				document.querySelectorAll(`[id=${modal_id}] [id=selected_filters] [class*=selected_filter]`).forEach(
					button_filter_value =>
					{
						selected_filters[button_filter_column.value].push(button_filter_value.value)
					}
				)
			}
		)
		const selected_category = document.querySelector('[id=categories_to_choose] [class*=selected]').value
		const selected_value = document.querySelector('[id=values_to_choose] [class*=selected]').value
		const selected_break_by = document.querySelector('[id=break_by_to_choose] [class*=selected]').value

		// disabling all the filters
		for (let filter of graph_filters)
		{
			filter.disabled = true
			filter.jaql.filter.members = []
			filter.jaql.filter.all = true
		}

		for (let [index, selected_column] of [selected_category, selected_value, selected_break_by].entries())
		{
			let graph_params = graph_widget.metadata.panels[index].items

			// applying choosen categories/break by values
			if (index == 0 | index == 2)
			{
				if (selected_column != undefined)
				{
					graph_params[0].disabled = false
					graph_params[0].jaql.column = selected_column
					graph_params[0].jaql.title = selected_column
					graph_params[0].jaql.table = find_table_name(selected_column)
				}
				else
				{
					graph_params[0].disabled = true
				}
			}
			// applying choosen values
			else
			{
				for (let graph_param of graph_params)
				{
					if (graph_param.jaql.title == selected_column)
						graph_param.disabled = false
					else
						graph_param.disabled = true
				}
			}
		}

		// applying choosen filters
		for (let [index, [filter_column, filter_values]] of Object.entries(selected_filters).entries())
		{
			graph_filters[index].jaql.column = filter_column
			graph_filters[index].disabled = false
			graph_filters[index].jaql.title = filter_column
			graph_filters[index].jaql.table = find_table_name(filter_column)
			graph_filters[index].jaql.filter.members = filter_values
			delete graph_filters[index].jaql.filter.all
		}

		graph_widget.changesMade()
		graph_widget.refresh()
	})

	// find name of a table to which a given column belongs
	function find_table_name(column)
	{
		var table_name
		for (let [table, columns] of Object.entries(tables))
		{
			if (columns.includes(column))
				table_name = table
		}

		return table_name
	}


	// function for creating modals where user select values for the filter
	// columns argument is a column name from list 'Columns for filters'
	function create_modal(column)
	{
		// container for all the modals
		const modals = document.querySelector('[class=modals]')
		const new_modal_html = `
		<div class='modal' id = 'modal_${column.split(' ').join('_')}'>
			<div class='modal_header'>
				<div class='title'>Select filter values for the ${column}</div>
				<button data-modal-close class='close_button'>&times;</button> 
			</div>

			<div style='display: flex; justify-content: space-between;'>
				<div style = 'text-align: center;'>
					<div style = 'margin: 20px 0px 0px 20px;'> 
						<span style='font-size: 15px; display: block'>Choose values to add to the filter:</span> 
					</div>
					<div style = 'margin: 0px 0px 0px 20px;'> 
						<input type='text' id='filter_values' placeholder='enter filter values' style='display: inline; margin-top: 5px;'> 
						<button class='button' id='enter_button' style='display: inline'>Enter</button> 
					</div>
					<div style='margin: 40px 0px 0px 20px;'> 
						<span style='font-size: 15px; display: block'>Selected values for the filter:</span>
						<ul class='scroll_window' id = 'selected_filters'></ul>
					</div>
				</div>

				<div style = 'margin: 20px 20px 0px 0px;  text-align: center;'>
					<span style = 'display: block;'>List of saved filters:</span>
					<ul style = 'display: block;' class='saved_filters scroll_window values_to_choose'> </ul>
				</div>
			</div>

			<div style='position: absolute; bottom: 10%; right: 30%'> 
				<button class='button' id='save_filter' style='display: inline; position: relative; left: 60%; width: 100px'>Save filter as: </button> 
				<input type='text' id='input_save_filter_name' placeholder='saved filter name' style='display: inline; position: relative; left: 60%;'>            
				<button class='button' id='clear_filters' style='display: block; position: relative; left: 60%; width: 100px'>Clear filters</button> 
			</div>
		</div>`

		modals.innerHTML += new_modal_html
	}


	// creating button in 'selected filters' list with the values for filter
	function create_filter_button(filter_value)
	{
		let new_filter_button = document.createElement('button')
		new_filter_button.classList.add('button', 'selected_filter')
		new_filter_button.style.width = '175px'
		new_filter_button.value = new_filter_button.textContent = filter_value
		// after clicking on the button with filter remove it
		new_filter_button.addEventListener('click', (event) => {
			event.target.remove()
		})

		return new_filter_button
	}

	// creating buttons with values to choose
	function add_columns_for_filters(columns_for_filters)
	{
		const values_list_ul = document.querySelector('[id=columns_for_filters]')

		for (let column of columns_for_filters)
		{
			let button = document.createElement('button')
			button.value = button.textContent = column
			button.style.width = '175px'
			button.classList.add('button')
			button.id = column.split(' ').join('_')

			let modal_id = 'modal_' + column.split(' ').join('_')
			button.addEventListener('click', (event) => {
				const modal = document.querySelector(`[id=${modal_id}]`)
				openModal(modal)
			})
			values_list_ul.appendChild(button)
		}
	}

	// creating buttons with categories/values/break by to choose for the graph
	function add_values_to_choose(values_to_choose, list_id)
	{
		const values_to_choose_list = document.querySelector(`[id=${list_id}]`)

		for (let value of values_to_choose)
		{
			let button
			button = document.createElement('button')
			button.value = button.textContent = value
			button.style.width = '175px'
			button.classList.add('button')
			button.addEventListener('click', () => {
				const values_to_choose_buttons = values_to_choose_list.querySelectorAll('button')

				for (let list_button of values_to_choose_buttons)
				{
					if (list_button.classList.contains('selected')) 
						list_button.classList.remove('selected')
				}
				button.classList.add('selected')
			})
			values_to_choose_list.appendChild(button)
		}
	}

	function openModal(modal_to_open) 
	{
		if (modal_to_open == null) return
		if (!modal_to_open.classList.contains('active'))
			modal_to_open.classList.add('active')

		// close other modals, we dont want to have multiple modals open at the same time
		let modal_to_close
		for (let modal_id of modal_ids)
		{
			modal_to_close = document.querySelector(`[id=${modal_id}`)
			if (modal_to_close.classList.contains('active') & modal_to_close != modal_to_open)
				closeModal(modal_to_close)
		}
	}

	function closeModal(modal) 
	{
		if (modal == null) return
		if (modal.classList.contains('active'))
			modal.classList.remove('active')

		// when we close modal and there are selected filters then color the button used to open that modal
		// in order to indicate that there are some filters selected
		let button_id = modal.id.split('modal')[1].slice(1)
		let open_modal_button = document.querySelector(`[id=columns_for_filters] [id=${button_id}]`)

		if (modal.querySelectorAll('[id=selected_filters] [class*=button]').length > 0)
			open_modal_button.classList.add('selected')
		else
			open_modal_button.classList.remove('selected')
	}

	// loading current saved filters
	function load_saved_blox_configurations(dashboard_id, blox_widget_id)
	{
		// current_saved_blox_configs has format: 
		// {dashboard_id: {blox_widget_id: {column_name1: {save_name: list_of_filter_values}, column_name2: {save_name: list_of_filter_values}, ...}}}
		let current_saved_blox_configs

		if (localStorage['blox_saved_configs'] == undefined)
		{
			current_saved_blox_configs = {}
			current_saved_blox_configs[dashboard_id] = {}
			current_saved_blox_configs[dashboard_id][blox_widget_id] = {}
		}
		else
			current_saved_blox_configs = JSON.parse(localStorage['blox_saved_configs'])

		if (current_saved_blox_configs[dashboard_id] == undefined)
		{
			current_saved_blox_configs[dashboard_id] = {}
			current_saved_blox_configs[dashboard_id][blox_widget_id] = {}
		}
		else if (current_saved_blox_configs[dashboard_id][blox_widget_id] == undefined)
		{
			current_saved_blox_configs[dashboard_id][blox_widget_id] = {}
		}

		for (let column of columns_for_filters)
		{
			if (current_saved_blox_configs[dashboard_id][blox_widget_id][column] == undefined)
				current_saved_blox_configs[dashboard_id][blox_widget_id][column] = {}
		}

		return current_saved_blox_configs
	}

	function create_buttons_with_saves(modal_id, dashboard_id, blox_widget_id)
	{
		const modal = document.querySelector(`[id=${modal_id}]`)
		const saved_filters_list = modal.querySelector('[class*=saved_filters]')
		const current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)

		// clear saved_filters_list
		saved_filters_list.querySelectorAll('button').forEach(button => button.remove())

		let key = modal_id.split('_').slice(1).join(' ')

		for (let [save_name, saved_filter_values] of Object.entries(current_saved_blox_configs[dashboard_id][blox_widget_id][key]))
		{
			let div = document.createElement('div')
			let new_save_button = document.createElement('button')
			let delete_save_button = document.createElement('button')
			new_save_button.textContent = save_name
			new_save_button.value = saved_filter_values
			new_save_button.style.width = '175px'
			new_save_button.classList.add('button')

			delete_save_button.textContent = 'x'
			delete_save_button.classList.add('button')

			new_save_button.style.display = 'inline-block'

			delete_save_button.setAttribute('style', 'display: inline-block; margin-left: 5px !important')

			// after clicking on the button enter saved values to an appropriate list
			new_save_button.addEventListener('click', () => {
				let selected_filters_list = modal.querySelector('[id=selected_filters]')

				// add new buttons with filter values
				for (let filter_value of new_save_button.value.split(','))
				{
					let new_filter_value_button = create_filter_button(filter_value)
					selected_filters_list.appendChild(new_filter_value_button)
				}

				// after adding new values for filter the button which opens a given modal should be marked as selected
				let open_modal_button = document.querySelector(`[id=${modal_id.split('modal_')[1]}`)
				if (!open_modal_button.classList.contains('selected'))
					open_modal_button.classList.add('selected')
			})

			delete_save_button.addEventListener('click', (arg) => {
				// remove button with saved filter
				arg.path[0].parentElement.remove()

				// remove saved filter from localStorage
				delete current_saved_blox_configs[dashboard_id][blox_widget_id][key][save_name]
				localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)
			})

			div.appendChild(new_save_button)
			div.appendChild(delete_save_button)
			saved_filters_list.appendChild(div)
		}
	}
})