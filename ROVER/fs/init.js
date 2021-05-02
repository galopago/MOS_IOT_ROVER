
load('api_timer.js');
load('api_mqtt.js');
load('api_gpio.js');
load('api_pwm.js');

let CMD_ST = 1;
let CMD_FD = 2;
let CMD_BK = 3;
let CMD_RT = 4;
let CMD_LT = 5;

let CMD_ER = 99;

// 4 motors (Front Left, Back Left, Front Right, Back Right) , 2 I/O pins for each H-Bridge. 
let MOTOR_FL_PIN_A = 26;
let MOTOR_FL_PIN_B = 27;

let MOTOR_BL_PIN_A = 33;
let MOTOR_BL_PIN_B = 25;

let MOTOR_FR_PIN_A = 16;
let MOTOR_FR_PIN_B = 17;

let MOTOR_BR_PIN_A = 18;
let MOTOR_BR_PIN_B = 19;


let PWM_UPDATE_TICK_MS=100;
let CMD_UPDATE_TICK_MS=100;

let RAMP_TIME_MS = 200;
let RAMP_STEPS = 10;


let p_command = CMD_ST;				// present command:	st=stop, fd=forward, bk=backward, rt=right turn, lt= left turn
let speed = 0;						//	0 to 100%
let s_command = CMD_ST;				// set command
let beforestop_command = CMD_FD;	
let p_speed = 0;					// present speed - used for ramp
let s_speed = 0;					// set speed     - used for ramp
let d_speed = 0;					// delta speed   - used for ramp
let speed_change_flag = 0;
let command_change_flag = 0;


let topic_frequency = '/mosiotrover/frequency';
let topic_speed = '/mosiotrover/speed';
let topic_command = '/mosiotrover/command';

let pwm = 0;
let frequency = 100;


// GPIO init

GPIO.setup_output(MOTOR_FL_PIN_A,0);
GPIO.setup_output(MOTOR_FL_PIN_B,0);

GPIO.setup_output(MOTOR_BL_PIN_A,0);
GPIO.setup_output(MOTOR_BL_PIN_B,0);

GPIO.setup_output(MOTOR_FR_PIN_A,0);
GPIO.setup_output(MOTOR_FR_PIN_B,0);

GPIO.setup_output(MOTOR_BR_PIN_A,0);
GPIO.setup_output(MOTOR_BR_PIN_B,0);


// ************************************************
// listen to MQTT server topic to pwm frequency
// ************************************************

MQTT.sub(topic_frequency,function(conn,topic,msg){
	print('Topic:', topic, 'message:', msg);
	frequency=JSON.parse(msg);
},null);

// ************************************************
// listen to MQTT server topic to speed
// ************************************************

MQTT.sub(topic_speed,function(conn,topic,msg){
	print('Topic:', topic, 'message:', msg);
	speed=JSON.parse(msg);

	//truncating MAX and MIN speed values
	if (speed > 100)
		speed = 100;
		
	if (speed < 0)
		speed = 0;
		
},null);

// ************************************************
// listen to MQTT server topic to command
// ************************************************

MQTT.sub(topic_command,function(conn,topic,msg){
	
	print('Topic:', topic, 'message:', msg);
	if(msg === "st")
	{
		s_command=CMD_ST;	
	}
	else if (msg === "fd")
	{
		s_command=CMD_FD;
	}
	else if (msg === "bk")
	{
		s_command=CMD_BK;
	}
	else if (msg === "rt")
	{
		s_command=CMD_RT;
	}
	else if (msg === "lt")
	{
		s_command=CMD_LT;
	}
	else 
	{
		s_command=CMD_ER;
	}
	//print('s_command:', s_command,'p_command:', p_command);
	// sanity checks!
		
},null);

// ************************************************
// update PWM values to IO every  PWM_UPDATE_TICK_MS seconds
// ************************************************

Timer.set(PWM_UPDATE_TICK_MS, Timer.REPEAT, function() {
	pwm = p_speed / 100.0;
	
	if ( p_command === CMD_FD )
		{
			PWM.set(MOTOR_FL_PIN_B,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_B,frequency,pwm);	
		}
	else if ( p_command === CMD_BK )
		{
			PWM.set(MOTOR_FL_PIN_A,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_A,frequency,pwm);	
		}	
	else if ( p_command === CMD_ST  && beforestop_command === CMD_FD )
		{
			PWM.set(MOTOR_FL_PIN_B,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_B,frequency,pwm);	
		}	
	else if ( p_command === CMD_ST  && beforestop_command === CMD_BK )
		{
			PWM.set(MOTOR_FL_PIN_A,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_A,frequency,pwm);	
		}
	else if ( p_command === CMD_RT )
		{
			PWM.set(MOTOR_FL_PIN_B,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_A,frequency,pwm);	
		}		
	else if ( p_command === CMD_ST && beforestop_command === CMD_RT )
		{
			PWM.set(MOTOR_FL_PIN_B,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_A,frequency,pwm);	
		}			
	else if ( p_command === CMD_LT )
		{
			PWM.set(MOTOR_FL_PIN_A,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_B,frequency,pwm);	
		}		
	else if ( p_command === CMD_ST && beforestop_command === CMD_LT )
		{
			PWM.set(MOTOR_FL_PIN_A,frequency,pwm);
			PWM.set(MOTOR_BL_PIN_A,frequency,pwm);	
			PWM.set(MOTOR_FR_PIN_B,frequency,pwm);	
			PWM.set(MOTOR_BR_PIN_B,frequency,pwm);	
		}			
	else
		{
			print("PWM error, unknown command!");
		}

}, null);



// ************************************************
// Ramp calculator to change speed smoothly (without changing command) from actual value to set value
// ************************************************

Timer.set(RAMP_TIME_MS/( RAMP_STEPS*2), Timer.REPEAT, function() {

	if (p_speed !== s_speed && speed_change_flag === 0)
	{
		speed_change_flag = 1;
		d_speed = s_speed - p_speed ;
	}

	if(speed_change_flag === 1)
		{			
			if(d_speed > 0)
				{
					// accelerate
					if(p_speed + (d_speed/(RAMP_STEPS*2)) < s_speed)
					{
						p_speed = p_speed + (d_speed/(RAMP_STEPS*2));
					}					
					else
					{
						p_speed = s_speed;
						speed_change_flag = 0; 
					}
				}
			else
				{
					// deaccelerate
					if(p_speed + (d_speed/(RAMP_STEPS*2)) > s_speed)
					{
						p_speed = p_speed + (d_speed/(RAMP_STEPS*2));
					}
					else
					{
						p_speed = s_speed;
						speed_change_flag = 0; 
					}
				}										
		}
		
}, null);

// ************************************************
// Command state machine
// ************************************************

Timer.set(CMD_UPDATE_TICK_MS, Timer.REPEAT, function() {
	if (p_command !== s_command && command_change_flag === 0)
		{
			command_change_flag = 1;
		}
	
	if( command_change_flag === 1 )
	{
		// from STOP to FORWARD
		if (p_command === CMD_ST && s_command === CMD_FD)	
		{
			s_speed = speed;
			p_command = CMD_FD;
			command_change_flag = 0;
			print('FORWARD!');
		}
		// from FORWARD to STOP	
		else if (p_command === CMD_FD && s_command === CMD_ST)	
		{
			s_speed = 0;
			p_command = CMD_ST;
			beforestop_command =CMD_FD;
			command_change_flag = 0;
			print('STOP!');
			print("beforestop_command:",beforestop_command);
		}
		// from STOP to BACKWARD
		else if (p_command === CMD_ST && s_command ===CMD_BK)	
		{
			s_speed = speed;
			p_command = CMD_BK;
			command_change_flag = 0;
			print('BACKWARD!');			
		}
		// from BACKWARD to STOP	
		else if (p_command ===CMD_BK && s_command ===CMD_ST)	
		{
			s_speed = 0;
			p_command = CMD_ST;
			beforestop_command =CMD_BK;			
			command_change_flag = 0;
			print('STOP!');
			print("beforestop_command:",beforestop_command);
		}
		// from STOP to RIGHT TURN
		else if (p_command === CMD_ST && s_command === CMD_RT)	
		{
			s_speed = speed;
			p_command = CMD_RT;			
			command_change_flag = 0;
			print('RIGHT TURN!');	
		}
		// from RIGHT TURN to STOP
		else if (p_command === CMD_RT && s_command === CMD_ST)	
		{
			s_speed = 0;
			p_command = CMD_ST;
			beforestop_command =CMD_RT;			
			command_change_flag = 0;
			print('STOP!');
			print("beforestop_command:",beforestop_command);
		}
		// from STOP to LEFT TURN
		else if (p_command === CMD_ST && s_command === CMD_LT)	
		{
			s_speed = speed;
			p_command = CMD_LT;			
			command_change_flag = 0;
			print('LEFT TURN!');	
		}
		// from LEFT TURN to STOP
		else if (p_command === CMD_LT && s_command === CMD_ST)	
		{
			s_speed = 0;
			p_command = CMD_ST;
			beforestop_command =CMD_LT;			
			command_change_flag = 0;
			print('STOP!');
			print("beforestop_command:",beforestop_command);
		}
		else
		{
			print('UNKNOWN!:',s_command);
			s_command = p_command;	
			command_change_flag = 0;		
		}
		
	//print('p_command:', p_command,'s_command:', s_command,'command_change_flag',command_change_flag);
	}
		
	
}, null);
