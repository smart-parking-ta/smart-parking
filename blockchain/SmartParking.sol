// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract SmartParking {
  address public admin;

  constructor(){
    admin = msg.sender;
  }

  modifier onlyAdmin(){
      require(msg.sender == admin, "Only admin can access this");
      _;
  }

  mapping(uint256 => Order) orders;
  mapping(uint256 => OrderDetail) ordersDetail;

  enum Status {NOT_PAID, PAID}

  struct Order {
    uint256 user_id;
    uint256 balance;
    string plate_number;
    uint256[] order_id;
    }

  struct OrderDetail {
      uint256 user_id;
      uint256 time_enter;
      uint256 time_exit;
      uint256 price;
      Status status;
  }

  function getUserInfo(uint256 _user_id) public onlyAdmin view returns (
    uint256 user_id, uint256 balance, string memory plate_number, uint256[] memory order_id){
      return (orders[_user_id].user_id, orders[_user_id].balance, orders[_user_id].plate_number, orders[_user_id].order_id);
  }

  function getOrderDetail(uint256 _order_id) public onlyAdmin view returns (
    uint256 user_id, uint256 time_enter, uint256 time_exit, uint256 price, Status status){
      return (ordersDetail[_order_id].user_id, ordersDetail[_order_id].time_enter, ordersDetail[_order_id].time_exit, ordersDetail[_order_id].price, ordersDetail[_order_id].status);
  }

  function userRegister(uint256 _user_id, string memory _plate_number) public onlyAdmin {
    Order storage order = orders[_user_id];
    order.user_id = _user_id;
    order.plate_number = _plate_number;
  }

  function topUpBalance(uint256 _user_id, uint256 _value) public onlyAdmin {
    Order storage order = orders[_user_id];
    order.balance += _value;
  }

  function addOrder(
      uint256 _user_id,
      uint256 _order_id,
      uint256 _time_enter
      ) public onlyAdmin {
          Order storage order = orders[_user_id];
          OrderDetail storage orderDetail = ordersDetail[_order_id];
          
          order.order_id.push(_order_id);
          
          orderDetail.user_id = _user_id;
          orderDetail.time_enter = _time_enter;
          orderDetail.price = 4000;
          orderDetail.status = Status.NOT_PAID;
  }

  function insertExit(
    uint256 _order_id,
    uint256 _time_exit,
    uint256 _price
    ) public onlyAdmin {
      OrderDetail storage orderDetail = ordersDetail[_order_id];
      Order storage order = orders[orderDetail.user_id];
      
      require (_time_exit > orderDetail.time_enter, "Time exit must greater than enter");
      require (order.balance >= _price, "Balance not enough to pay");
      
      order.balance -= _price;
      orderDetail.time_exit = _time_exit;
      orderDetail.price = _price;
      orderDetail.status = Status.PAID;
  }

}
