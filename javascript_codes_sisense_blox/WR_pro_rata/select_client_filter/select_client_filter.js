const dashboard_id = '635685b4b654c20037109efb'
const blox_widget_id = '63ac0eb68fbb4c003607478f'
const widget_id = '63aad7378fbb4c00360745bc'

widget.on('ready', () => {
	create_buttons_with_saves(dashboard_id, blox_widget_id)
	
	// adding event listener to the enter button for entering filter values
	let enter_button = document.querySelector('[id=enter_button_client_filter]')
	enter_button.addEventListener('click', () => {
		const input = document.querySelector('[id=client_filter_values]')
		const entered_filter_values = input.value.split(', ')
		const selected_filters_list = document.querySelector('[id=selected_client_filters]')

		// clear input after clicking on Enter
		input.value = ''

		for (let filter_value of entered_filter_values)
		{
			// creating buttons for each entered filter
			let new_filter_button = create_filter_button(filter_value)
			selected_filters_list.appendChild(new_filter_button)
		}
	})

	// adding event listener to the save button for saving filter configuration
	let save_button = document.querySelector('[id=save_client_filter]')
	save_button.addEventListener('click', () => {
		const input = document.querySelector('[id=save_client_filter_values]')
		const entered_filter_name = input.value
		const selected_filter_values = []
		// entering selected filter values into the list selected_filter_values
		document.querySelectorAll('[id=selected_client_filters] button').forEach(button => selected_filter_values.push(button.value))

		// clear input after saving
		input.value = ''

		// saving fitlers in localStorage
		// current_saved_blox_configs has format: 
		// {dashboard_id: {blox_widget_id: {categories_filters: {save_name: list_of_filter_values}, values_filters: {save_name: list_of_filter_values}, ...}}}
		let current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)

		// check if there is already save with given name
		if (Object.keys(current_saved_blox_configs[dashboard_id][blox_widget_id]).includes(entered_filter_name))
		{
			alert('there is already such a save name, choose a different name')
			return
		}

		// modify saved filters
		current_saved_blox_configs[dashboard_id][blox_widget_id][entered_filter_name] = selected_filter_values
		// save modified filters
		localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)

		// creating button with save in the modal with saves
		create_buttons_with_saves(dashboard_id, blox_widget_id)
	})
	
	//adding event listener to the apply button
	let apply_button = document.querySelector('[id=apply_client_filter]')
	apply_button.addEventListener('click', () => {
		let selected_filter_values = []
		// adding selected filter values to the list
		document.querySelectorAll('[id=selected_client_filters] [class*=selected_filter]').forEach(el => selected_filter_values.push(el.value))
		
		let graph_widget = prism.activeDashboard.widgets.$$widgets.find(w => w.oid == widget_id)
		let graph_filter = graph_widget.metadata.panels[3].items[0].jaql.filter
		
		// remove filter if there are no selected filters
		if (selected_filter_values.length == 0)
		{
			graph_filter.all = true
			graph_filter.members = []
		}
		else
		{
			delete graph_filter.all
			graph_filter.members = selected_filter_values
		}
		
		graph_widget.changesMade()
		graph_widget.refresh()
	})

    // adding event listener to the clear button which removes all selected filters
    let clear_button = document.querySelector('[id=clear_selected_filters]')
    clear_button.addEventListener('click', () => {
        document.querySelectorAll('[id=selected_client_filters] [class*=selected_filter]').forEach(el => el.remove())
    })

	function create_filter_button(filter_value)
	{
		let new_filter_button = document.createElement('button')
		new_filter_button.classList.add('button', 'selected_filter')
		new_filter_button.style.width = '175px'
		new_filter_button.value = new_filter_button.textContent = filter_value
		// after clicking on the button with filter remove it
		new_filter_button.addEventListener('click', (arg) => {
			arg.path[0].remove()
		})

		return new_filter_button
	}

	// creating buttons with saved filters
	function create_buttons_with_saves(dashboard_id, blox_widget_id)
	{
		const saved_filters_list = document.querySelector('[id=saved_client_filters]')
		const current_saved_blox_configs = load_saved_blox_configurations(dashboard_id, blox_widget_id)

		// clear saved_filters_list
		saved_filters_list.querySelectorAll('button').forEach(button => button.remove())

		for (let [save_name, saved_filter_values] of Object.entries(current_saved_blox_configs[dashboard_id][blox_widget_id]))
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
				let selected_filters_list = document.querySelector('[id=selected_client_filters]')

				// remove all buttons from selected_filters_list
				//for (let button of selected_filters_list.querySelectorAll('button')) button.remove()

				// add new buttons with filter values
				for (let filter_value of new_save_button.value.split(','))
				{
					let new_filter_value_button = create_filter_button(filter_value)
					selected_filters_list.appendChild(new_filter_value_button)
				}
			})

			delete_save_button.addEventListener('click', (arg) => {
				// remove button with saved filter
				arg.path[0].parentElement.remove()

				// remove saved filter from localStorage
				delete current_saved_blox_configs[dashboard_id][blox_widget_id][save_name]
				localStorage['blox_saved_configs'] = JSON.stringify(current_saved_blox_configs)
			})

			div.appendChild(new_save_button)
			div.appendChild(delete_save_button)
			saved_filters_list.appendChild(div)
		}
	}


	// loading current saved filters
	function load_saved_blox_configurations(dashboard_id, blox_widget_id){
		// current_saved_blox_configs has format: 
		// {dashboard_id: {blox_widget_id: {categories_filters: {save_name: list_of_filter_values}, values_filters: {save_name: list_of_filter_values}, ...}}}
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

		return current_saved_blox_configs
	}
})